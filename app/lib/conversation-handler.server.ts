import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db.server";
import { detectCrisis, generateCrisisResponse } from "./crisis-detection.server";
import { performSafetyCheck, addSafetyGuidelinesToPrompt } from "./safety.server";
import { getContextualKnowledge } from "./knowledge-base.server";
import { getConversationContext, shouldGenerateSummary, generateConversationSummary, saveMessage } from "./memory.server";
import { getCompanionFeatures } from "./companion-features.server";
import { requireEnv } from "./env.server";
import type { CVDocumentMetadata, GenerativeContent, MessageMetadata } from "./types.server";
import { aiLogger } from "./logger.server";
import { PERFORMANCE_CONFIG } from "./config.server";
import { NotFoundError, handleExternalServiceError, AuthenticationError, handleDatabaseError } from "./errors.server";
import { validateOrThrow, companionIdSchema, userIdSchema, chatIdSchema, messageSchema } from "./validation.server";
import {
  isJobSearchRequest,
  getUserCV,
  buildCrisisResponse,
  buildUserMessageWithContext,
} from "./conversation-helpers.server";
import {
  analyzeConversationFlow,
  generateFollowUpQuestions,
  detectTopicTransition,
} from "./conversation-analysis.server";
import { getConversationQualityMetrics } from "./conversation-metrics.server";
import { buildEnhancedSystemPrompt } from "./conversation-prompt.server";

const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));

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
    aiLogger.request(companionId, userId, message.length);
    // Get conversation context
    const context = await getConversationContext(chatId);
    
    // Get companion details first
    const companion = await db.companion.findUnique({
      where: { id: companionId }
    });
    
    if (!companion) {
      throw new NotFoundError("Companion", companionId);
    }
    
    // Get onboarding data for personalization
    const { getOnboardingData } = await import("./onboarding.server");
    const onboardingData = await getOnboardingData(userId);
    
    // Get user's CV if chatting with Jobe
    const userCV = companion.name === "Jobe" 
      ? await getUserCV(userId, companion.id)
      : null;
    const cvText = userCV?.extractedText || "";
    
    // Check if user is asking for job search
    const jobSearchRequested = isJobSearchRequest(message);
    
    // If job search requested and we have CV, search for jobs
    let jobSearchResults = null;
    if (companion.name === "Jobe" && jobSearchRequested && cvText) {
      const { searchJobs, generateJobSearchQuery, formatJobResultsForAI } = await import("./job-search.server");
      
      const careerContext = onboardingData?.careerContext || {};
      
      const searchQuery = generateJobSearchQuery(cvText, {
        location: careerContext.location,
        industry: careerContext.industry,
        jobTitle: careerContext.jobTitle,
        remote: careerContext.relocationOpen,
      });
      
      aiLogger.request(companionId, userId, message.length); // Job search requested
      
      try {
        const jobResults = await searchJobs(searchQuery, careerContext.location);
        jobSearchResults = formatJobResultsForAI(jobResults.jobs);
        // Jobs found successfully
        } catch (jobSearchError) {
        const serviceError = handleExternalServiceError(jobSearchError, "JobSearch", "searchJobs", { companionId, userId });
        serviceError.log();
        jobSearchResults = "I encountered an issue searching for jobs, but I can still provide general career advice.";
      }
    }
    
    // Perform comprehensive safety check (includes crisis detection, moderation, etc.)
    const safetyResult = await performSafetyCheck(message, userId, chatId);
    
    // If crisis detected, return immediate crisis response
    if (safetyResult.crisisDetected || safetyResult.riskLevel === 'critical') {
      const crisisResponse = safetyResult.crisisResources
        ? buildCrisisResponse(safetyResult.crisisResources)
        : generateCrisisResponse(await detectCrisis(message, userId, chatId));
      
      return {
        response: crisisResponse,
        crisisDetected: true,
        crisisResources: safetyResult.crisisResources,
        knowledgeUsed: [],
        featuresSuggested: []
      };
    }
    
    // If intervention required but not critical crisis, provide supportive response with resources
    if (safetyResult.requiresIntervention && safetyResult.riskLevel !== 'critical') {
      // Continue with normal conversation but add safety awareness
      // The system prompt will handle professional boundaries
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
      onboardingData,
      userCV
    );
    
    // Generate response using Gemini
    const startTime = Date.now();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Include job search results in the message if available
    const userMessage = buildUserMessageWithContext(message, jobSearchResults);
    
    const conversationHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...context.recentMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: userMessage }] }
    ];
    
    let result;
    try {
      result = await model.generateContent({
        contents: conversationHistory as GenerativeContent[],
      });
    } catch (geminiError) {
      const serviceError = handleExternalServiceError(geminiError, "Gemini", "generateContent", { companionId, userId });
      serviceError.log();
      throw serviceError;
    }
    
    const response = await result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;
    aiLogger.response(companionId, userId, responseText.length, duration);
    
    // Save message to database
    await saveMessage(chatId, userId, 'USER', message, {
      sentiment: safetyResult.sentiment,
      keywords: safetyResult.keywords,
      crisisDetected: safetyResult.crisisDetected || safetyResult.shouldEscalate || false
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
    
    // Response generated successfully
    
    return {
      response: responseText,
      crisisDetected: false,
      knowledgeUsed: knowledge,
      featuresSuggested: features.slice(0, 2)
    };
    
  } catch (error) {
    // Log the error appropriately based on type
    if (error instanceof NotFoundError || error instanceof AuthenticationError) {
      // These are already logged in their constructors
      throw error;
    }
    
    const serviceError = handleExternalServiceError(error, "ConversationHandler", "generateEnhancedCompanionResponse", { companionId, userId });
    serviceError.log();
    
    // Fallback to basic response
    return {
      response: "I'm here to support you. How can I help you today?",
      crisisDetected: false,
      knowledgeUsed: [],
      featuresSuggested: []
    };
  }
}

// These functions have been moved to separate files:
// - buildEnhancedSystemPrompt -> conversation-prompt.server.ts
// - analyzeConversationFlow, generateFollowUpQuestions, detectTopicTransition -> conversation-analysis.server.ts
// - getConversationQualityMetrics -> conversation-metrics.server.ts
