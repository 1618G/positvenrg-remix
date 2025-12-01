/**
 * Conversation analysis functions
 * Extracted from conversation-handler.server.ts for better organization
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "./env.server";
import type { GenerativeContent } from "./types.server";
import { aiLogger } from "./logger.server";
import { handleExternalServiceError } from "./errors.server";
import type { ConversationContext } from "./conversation-handler.server";
import { db } from "./db.server";

const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));

/**
 * Analyze conversation flow and extract insights
 */
export async function analyzeConversationFlow(
  messages: Array<{ role: string; content: string; createdAt?: Date }>
): Promise<{
  conversationGoal: string;
  topicTransitions: string[];
  emotionalArc: string[];
  followUpQuestions: string[];
}> {
  try {
    const prompt = `Analyze this conversation and provide insights:

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond in JSON format:
{
  "conversationGoal": "main goal or purpose",
  "topicTransitions": ["topic1", "topic2"],
  "emotionalArc": ["emotion1", "emotion2"],
  "followUpQuestions": ["question1", "question2"]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }] as GenerativeContent[],
    });
    
    const response = await result.response;
    const analysisText = response.text();
    
    return JSON.parse(analysisText);
  } catch (error) {
    const serviceError = handleExternalServiceError(error, "Gemini", "analyzeConversationFlow");
    serviceError.log();
    return {
      conversationGoal: 'general support',
      topicTransitions: [],
      emotionalArc: ['neutral'],
      followUpQuestions: ['How are you feeling?', 'What would be helpful right now?']
    };
  }
}

/**
 * Generate follow-up questions based on conversation
 * Supports multiple function signatures for backward compatibility
 */
export async function generateFollowUpQuestions(
  companionIdOrContext: string | undefined | ConversationContext,
  contextOrMessages?: ConversationContext | Array<{ role: string; content: string }>,
  lastResponse?: string
): Promise<string[]> {
  let actualCompanionId: string | undefined;
  let recentMessages: Array<{ role: string; content: string }>;
  let conversationContext: ConversationContext | undefined;
  
  // Handle different function signatures
  if (typeof companionIdOrContext === 'string' || companionIdOrContext === undefined) {
    // Signature: (companionId, recentMessages)
    actualCompanionId = companionIdOrContext;
    recentMessages = (contextOrMessages as Array<{ role: string; content: string }>) || [];
  } else {
    // Signature: (conversationContext, companionId, lastResponse)
    conversationContext = companionIdOrContext as ConversationContext;
    actualCompanionId = contextOrMessages as string | undefined;
    lastResponse = lastResponse || (typeof contextOrMessages === 'string' ? contextOrMessages : undefined);
    recentMessages = conversationContext.recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  try {
    let prompt: string;
    
    // Use richer prompt if we have conversation context and companion
    if (conversationContext && lastResponse && actualCompanionId) {
      const companion = await db.companion.findUnique({ where: { id: actualCompanionId } });
      
      if (companion) {
        prompt = `As ${companion.name}, generate 3-5 thoughtful follow-up questions based on:
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
      } else {
        prompt = `Based on this conversation, suggest 3 helpful follow-up questions:

${recentMessages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Respond with one question per line, no numbering.`;
      }
    } else {
      prompt = `Based on this conversation, suggest 3 helpful follow-up questions:

${recentMessages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Respond with one question per line, no numbering.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }] as GenerativeContent[],
    });
    
    const response = await result.response;
    const questionsText = response.text();
    
    return questionsText.split('\n').filter(q => q.trim().length > 0);
  } catch (error) {
    const serviceError = handleExternalServiceError(error, "Gemini", "generateFollowUpQuestions", { companionId: actualCompanionId });
    serviceError.log();
    return [
      'How are you feeling right now?',
      'What would be most helpful for you?',
      'Is there anything specific you\'d like to talk about?'
    ];
  }
}

/**
 * Detect topic transitions in conversation
 * Supports multiple function signatures for backward compatibility
 */
export async function detectTopicTransition(
  currentMessageOrMessages: string | Array<{ role: string; content: string }>,
  previousMessages?: Array<{ content: string }>
): Promise<{
  transitionDetected: boolean;
  newTopic: string;
  transitionType: 'gradual' | 'sudden' | 'return';
}> {
  let currentMessage: string;
  let messages: Array<{ role: string; content: string }>;
  
  // Handle different function signatures
  if (typeof currentMessageOrMessages === 'string') {
    // Signature: (currentMessage, previousMessages)
    currentMessage = currentMessageOrMessages;
    messages = (previousMessages || []).map(msg => ({ role: 'user', content: msg.content }));
  } else {
    // Signature: (messages)
    messages = currentMessageOrMessages;
    if (messages.length < 2) {
      return {
        transitionDetected: false,
        newTopic: '',
        transitionType: 'gradual'
      };
    }
    currentMessage = messages[messages.length - 1].content;
    previousMessages = messages.slice(0, -1).map(msg => ({ content: msg.content }));
  }
  
  try {
    let prompt: string;
    
    if (typeof currentMessageOrMessages === 'string' && previousMessages) {
      // Use currentMessage and previousMessages
      const previousTopics = previousMessages
        .slice(-3)
        .map(msg => msg.content)
        .join(' ');
      
      prompt = `Analyze if there's a topic transition in this conversation:

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
    } else {
      // Use messages array
      const recentMessages = messages.slice(-4);
      prompt = `Detect if there's a topic transition in this conversation:

${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond in JSON:
{
  "transitionDetected": boolean,
  "newTopic": "new topic or empty string",
  "transitionType": "gradual" | "sudden" | "return"
}`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }] as GenerativeContent[],
    });
    
    const response = await result.response;
    const analysisText = response.text();
    
    return JSON.parse(analysisText);
  } catch (error) {
    const serviceError = handleExternalServiceError(error, "Gemini", "detectTopicTransition");
    serviceError.log();
    return {
      transitionDetected: false,
      newTopic: '',
      transitionType: 'gradual'
    };
  }
}
