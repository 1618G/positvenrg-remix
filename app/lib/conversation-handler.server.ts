import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db.server";
import { detectCrisis, generateCrisisResponse } from "./crisis-detection.server";
import { getContextualKnowledge } from "./knowledge-base.server";
import { getConversationContext, shouldGenerateSummary, generateConversationSummary, saveMessage } from "./memory.server";
import { getCompanionFeatures } from "./companion-features.server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string; createdAt: Date }>;
  summary?: {
    summary: string;
    keyPoints: any;
    sentiment: string;
    topics: string[];
  };
  userPreferences?: {
    preferences: any;
    triggers: any;
    goals: any;
  };
  companionKnowledge?: any[];
  crisisDetected?: boolean;
  crisisResources?: string[];
}

export async function generateEnhancedCompanionResponse(
  message: string,
  companionId: string,
  userId: string,
  chatId: string
): Promise<{
  response: string;
  crisisDetected: boolean;
  crisisResources?: string[];
  knowledgeUsed?: any[];
  featuresSuggested?: any[];
}> {
  try {
    // Get conversation context
    const context = await getConversationContext(chatId);
    
    // Get onboarding data for personalization
    const { getOnboardingData } = await import("./onboarding.server");
    const onboardingData = await getOnboardingData(userId);
    
    // Detect crisis first (safety priority)
    const crisisResult = await detectCrisis(message, userId, chatId);
    
    if (crisisResult.shouldEscalate) {
      return {
        response: generateCrisisResponse(crisisResult),
        crisisDetected: true,
        crisisResources: crisisResult.resources,
        knowledgeUsed: [],
        featuresSuggested: []
      };
    }
    
    // Get companion details
    const companion = await db.companion.findUnique({
      where: { id: companionId }
    });
    
    if (!companion) {
      throw new Error("Companion not found");
    }
    
    // Get contextual knowledge
    const knowledge = await getContextualKnowledge(
      companionId,
      message,
      context
    );
    
    // Get companion features
    const features = await getCompanionFeatures(companionId);
    
    // Build enhanced system prompt with onboarding data
    const systemPrompt = buildEnhancedSystemPrompt(
      companion,
      context,
      knowledge,
      features,
      onboardingData
    );
    
    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const conversationHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...context.recentMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];
    
    const result = await model.generateContent({
      contents: conversationHistory as any,
    });
    
    const response = await result.response;
    const responseText = response.text();
    
    // Save message to database
    await saveMessage(chatId, userId, 'USER', message, {
      sentiment: crisisResult.sentiment,
      keywords: crisisResult.keywords,
      crisisDetected: crisisResult.shouldEscalate
    });
    
    await saveMessage(chatId, userId, 'ASSISTANT', responseText, {
      knowledgeUsed: knowledge.map(k => k.title),
      featuresSuggested: features.slice(0, 2).map(f => f.name)
    });
    
    // Check if we should generate a conversation summary
    const messageCount = context.recentMessages.length;
    if (await shouldGenerateSummary(chatId, messageCount)) {
      await generateConversationSummary(chatId, context.recentMessages);
    }
    
    return {
      response: responseText,
      crisisDetected: false,
      knowledgeUsed: knowledge,
      featuresSuggested: features.slice(0, 2)
    };
    
  } catch (error) {
    console.error('Error generating enhanced companion response:', error);
    
    // Fallback to basic response
    return {
      response: "I'm here to support you. How can I help you today?",
      crisisDetected: false,
      knowledgeUsed: [],
      featuresSuggested: []
    };
  }
}

function buildEnhancedSystemPrompt(
  companion: any,
  context: any,
  knowledge: any[],
  features: any[],
  onboardingData?: any
): string {
  let prompt = `You are ${companion.name}, ${companion.description}. ${companion.systemPrompt || companion.personality}

Your role is to provide therapeutic-grade support with the following capabilities:

PERSONALITY & APPROACH:
- ${companion.personality}
- Always maintain a warm, empathetic, and non-judgmental tone
- Use active listening and validation techniques
- Provide evidence-based support when appropriate`;

  // Add personalized communication style from onboarding
  if (onboardingData) {
    const styleGuidance = getCommunicationStyleGuidance(onboardingData);
    prompt += `\n\nCOMMUNICATION STYLE (User Preferences):
${styleGuidance}`;
  }

  prompt += `\n\nCONVERSATION CONTEXT:`;

  // Add conversation summary if available
  if (context.summary) {
    prompt += `
- Previous conversation summary: ${context.summary.summary}
- Key topics discussed: ${context.summary.topics.join(', ')}
- Overall sentiment: ${context.summary.sentiment}`;
  }
  
  // Add user preferences if available
  if (context.userPreferences) {
    const prefs = context.userPreferences.preferences || {};
    const triggers = context.userPreferences.triggers || [];
    const goals = context.userPreferences.goals || {};
    
    prompt += `
- Communication style: ${prefs.communicationStyle || 'not specified'}
- Response length preference: ${prefs.responseLength || 'moderate'}
- Formality level: ${prefs.formality || 'casual'}`;
    
    if (triggers && triggers.length > 0) {
      prompt += `\n- IMPORTANT: Known triggers to avoid: ${triggers.join(', ')}`;
    }
    
    if (goals.goals) {
      prompt += `\n- User's goals: ${goals.goals}`;
    }
    
    if (goals.primaryNeeds && Array.isArray(goals.primaryNeeds) && goals.primaryNeeds.length > 0) {
      prompt += `\n- Primary support needs: ${goals.primaryNeeds.join(', ')}`;
    }
  }
  
  // Add specialized knowledge
  if (knowledge.length > 0) {
    prompt += `
SPECIALIZED KNOWLEDGE AVAILABLE:
${knowledge.map(k => `- ${k.title}: ${k.content.substring(0, 200)}...`).join('\n')}`;
  }
  
  // Add companion features
  if (features.length > 0) {
    prompt += `
SPECIALIZED FEATURES YOU CAN OFFER:
${features.map(f => `- ${f.name}: ${f.description}`).join('\n')}`;
  }
  
  // Add response length guidance from onboarding
  if (onboardingData?.responseLength) {
    const lengthGuidance = {
      brief: "Keep responses concise (1-2 sentences). Be direct and to the point.",
      moderate: "Provide balanced responses (2-4 sentences). Include context but stay focused.",
      detailed: "Provide comprehensive responses (4+ sentences). Include examples and context when helpful."
    };
    prompt += `\n\nRESPONSE LENGTH: ${lengthGuidance[onboardingData.responseLength as keyof typeof lengthGuidance] || lengthGuidance.moderate}`;
  }

  prompt += `

RESPONSE GUIDELINES:
1. Always prioritize user safety and wellbeing
2. Use the specialized knowledge when relevant to the conversation
3. Suggest appropriate features when they could help
4. Maintain conversation flow and ask follow-up questions
5. Be specific and actionable in your responses
6. If you detect crisis indicators, prioritize safety resources
7. Keep responses conversational but therapeutic in nature
8. Validate emotions and provide hope when appropriate
9. ${onboardingData?.triggers && onboardingData.triggers.length > 0 
    ? `AVOID these sensitive topics: ${onboardingData.triggers.join(', ')}. Be especially careful around these areas.`
    : 'Be mindful of sensitive topics and approach with care.'}

Remember: You are a supportive AI companion, not a replacement for professional therapy. Always encourage professional help when appropriate.`;
  
  return prompt;
}

function getCommunicationStyleGuidance(onboardingData: any): string {
  const style = onboardingData.communicationStyle;
  const formality = onboardingData.formality;
  
  const styleGuidance = {
    direct: "Be straightforward and clear. Avoid excessive pleasantries. Get to the point while remaining respectful.",
    gentle: "Use soft language. Be very empathetic and patient. Allow space for processing. Validate frequently.",
    encouraging: "Maintain positive energy. Focus on motivation and hope. Celebrate small wins. Use uplifting language.",
    listening: "Prioritize reflection and validation. Ask thoughtful questions. Mirror the user's feelings. Avoid giving unsolicited advice."
  };
  
  const formalityGuidance = {
    casual: "Use casual, friendly language. You can use contractions. Feel free to be conversational.",
    professional: "Use respectful, professional language. Maintain appropriate boundaries. Be courteous and formal.",
    friendly: "Use warm, friendly language while maintaining professionalism. Balance approachability with respect."
  };
  
  return `${styleGuidance[style as keyof typeof styleGuidance] || styleGuidance.gentle}\n${formalityGuidance[formality as keyof typeof formalityGuidance] || formalityGuidance.friendly}`;
}

export async function analyzeConversationFlow(
  messages: Array<{ role: string; content: string; createdAt: Date }>
): Promise<{
  conversationGoal: string;
  topicTransitions: string[];
  emotionalArc: string[];
  followUpQuestions: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const analysisPrompt = `Analyze this conversation and provide:
1. What is the user's main goal or need?
2. What topic transitions occurred?
3. What is the emotional arc (how emotions changed)?
4. What follow-up questions would be helpful?

Conversation:
${conversationText}

Respond in JSON format:
{
  "conversationGoal": "main goal or need",
  "topicTransitions": ["transition1", "transition2"],
  "emotionalArc": ["emotion1", "emotion2", "emotion3"],
  "followUpQuestions": ["question1", "question2", "question3"]
}`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text();
    
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing conversation flow:', error);
    return {
      conversationGoal: 'general support',
      topicTransitions: [],
      emotionalArc: ['neutral'],
      followUpQuestions: ['How are you feeling?', 'What would be helpful right now?']
    };
  }
}

export async function generateFollowUpQuestions(
  companionId: string,
  conversationContext: ConversationContext,
  lastResponse: string
): Promise<string[]> {
  try {
    const companion = await db.companion.findUnique({
      where: { id: companionId }
    });
    
    if (!companion) {
      return ['How are you feeling?', 'What would be helpful right now?'];
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `As ${companion.name}, generate 3-5 thoughtful follow-up questions based on:
- Your companion personality: ${companion.personality}
- Recent conversation context: ${conversationContext.summary?.summary || 'No previous context'}
- Your last response: ${lastResponse}
- User's emotional state: ${conversationContext.summary?.sentiment || 'neutral'}

Generate questions that:
1. Show you're listening and care
2. Help the user explore their feelings
3. Offer practical support
4. Are appropriate for your companion's expertise
5. Are open-ended and non-judgmental

Respond with just the questions, one per line:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const questionsText = response.text();
    
    return questionsText.split('\n').filter(q => q.trim().length > 0);
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [
      'How are you feeling right now?',
      'What would be most helpful for you?',
      'Is there anything specific you\'d like to talk about?'
    ];
  }
}

export async function detectTopicTransition(
  currentMessage: string,
  previousMessages: Array<{ content: string }>
): Promise<{
  transitionDetected: boolean;
  newTopic: string;
  transitionType: 'gradual' | 'sudden' | 'return';
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const previousTopics = previousMessages
      .slice(-3)
      .map(msg => msg.content)
      .join(' ');
    
    const prompt = `Analyze if there's a topic transition in this conversation:

Previous messages: ${previousTopics}
Current message: ${currentMessage}

Determine:
1. Is there a topic transition?
2. What is the new topic?
3. Is it gradual, sudden, or a return to a previous topic?

Respond in JSON:
{
  "transitionDetected": true/false,
  "newTopic": "topic name",
  "transitionType": "gradual/sudden/return"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error detecting topic transition:', error);
    return {
      transitionDetected: false,
      newTopic: '',
      transitionType: 'gradual'
    };
  }
}

export async function getConversationQualityMetrics(
  chatId: string
): Promise<{
  messageCount: number;
  averageResponseTime: number;
  crisisDetections: number;
  knowledgeUsage: number;
  featureSuggestions: number;
  userSatisfaction: number;
}> {
  try {
    const messages = await db.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }
    });
    
    const crisisLogs = await db.crisisLog.count({
      where: { chatId }
    });
    
    const knowledgeUsage = messages.filter(msg => 
      msg.metadata && (msg.metadata as any).knowledgeUsed
    ).length;
    
    const featureSuggestions = messages.filter(msg => 
      msg.metadata && (msg.metadata as any).featuresSuggested
    ).length;
    
    // Calculate average response time (simplified)
    const responseTimes = [];
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      if (prev.role === 'USER' && curr.role === 'ASSISTANT') {
        responseTimes.push(curr.createdAt.getTime() - prev.createdAt.getTime());
      }
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000 // Convert to seconds
      : 0;
    
    return {
      messageCount: messages.length,
      averageResponseTime,
      crisisDetections: crisisLogs,
      knowledgeUsage,
      featureSuggestions,
      userSatisfaction: 0 // Would need user feedback system
    };
  } catch (error) {
    console.error('Error getting conversation quality metrics:', error);
    return {
      messageCount: 0,
      averageResponseTime: 0,
      crisisDetections: 0,
      knowledgeUsage: 0,
      featureSuggestions: 0,
      userSatisfaction: 0
    };
  }
}
