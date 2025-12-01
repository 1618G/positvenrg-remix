/**
 * Helper functions for conversation handling
 * Extracted from conversation-handler.server.ts to reduce complexity
 */

import { db } from "./db.server";
import type { CVDocumentMetadata } from "./types.server";
import { validateOrThrow, userIdSchema, companionIdSchema } from "./validation.server";

/**
 * Check if message is a job search request
 */
export function isJobSearchRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const jobKeywords = [
    "job",
    "opportunity",
    "position",
    "hiring",
    "where to look",
    "find jobs",
    "search jobs",
  ];
  
  return jobKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Retrieve user's CV document for Jobe companion
 */
export async function getUserCV(userId: string, companionId: string): Promise<CVDocumentMetadata | null> {
  validateOrThrow(userIdSchema, userId, "userId");
  validateOrThrow(companionIdSchema, companionId, "companionId");
  
  const cvDocument = await db.userDocument.findFirst({
    where: {
      userId,
      companionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  if (!cvDocument || !cvDocument.metadata) {
    return null;
  }
  
  const metadata = cvDocument.metadata as CVDocumentMetadata;
  return {
    extractedText: metadata.extractedText || "",
    keywords: metadata.keywords || [],
    filename: cvDocument.originalName,
  };
}

/**
 * Handle crisis response generation
 */
export function buildCrisisResponse(
  crisisResources?: string[],
  fallbackResponse?: string
): string {
  if (crisisResources && crisisResources.length > 0) {
    return `I'm deeply concerned about what you're sharing. Your safety is the most important thing right now.

**Please reach out for immediate support:**
${crisisResources.map(resource => `• ${resource}`).join('\n')}

You don't have to face this alone. There are people who care and want to help you through this difficult time. Please consider reaching out to one of these resources right now.

I'm here to listen and support you, but your safety comes first.`;
  }
  
  return fallbackResponse || "I'm here to support you. Please reach out to a mental health professional or crisis hotline if you need immediate help.";
}

/**
 * Build enhanced user message with job search results
 */
export function buildUserMessageWithContext(
  message: string,
  jobSearchResults: string | null
): string {
  if (!jobSearchResults) {
    return message;
  }
  
  return `${message}\n\n[Job Search Results]\n${jobSearchResults}`;
}

