/**
 * System prompt building functions
 * Extracted from conversation-handler.server.ts for better organization
 */

import type { Companion } from "@prisma/client";
import type { ConversationContext } from "./conversation-handler.server";
import type { CVDocumentMetadata, OnboardingData } from "./types.server";
import { addSafetyGuidelinesToPrompt } from "./safety.server";

interface CompanionFeatures {
  name: string;
  description: string;
}

/**
 * Build enhanced system prompt with context
 */
export function buildEnhancedSystemPrompt(
  companion: Companion,
  context: ConversationContext,
  knowledge: Array<{ title: string; content: string }>,
  features: CompanionFeatures[],
  onboardingData: OnboardingData | null,
  userCV: CVDocumentMetadata | null
): string {
  let prompt = `${companion.systemPrompt || `You are ${companion.name}, ${companion.description || 'a supportive AI companion'}.`}\n\n`;

  // Add personality and context
  if (companion.personality) {
    prompt += `Personality: ${companion.personality}\n\n`;
  }

  // Add conversation summary if available
  if (context.summary) {
    prompt += `Conversation Summary:\n${context.summary.summary}\n\n`;
    if (context.summary.keyPoints) {
      prompt += `Key Points: ${JSON.stringify(context.summary.keyPoints)}\n\n`;
    }
  }

  // Add user preferences from onboarding
  if (onboardingData) {
    if (onboardingData.communicationStyle) {
      prompt += `User prefers ${onboardingData.communicationStyle} communication style.\n`;
    }
    if (onboardingData.responseLength) {
      prompt += `User prefers ${onboardingData.responseLength} responses.\n`;
    }
    if (onboardingData.formality) {
      prompt += `User prefers ${onboardingData.formality} tone.\n`;
    }
    if (onboardingData.triggers && Array.isArray(onboardingData.triggers) && onboardingData.triggers.length > 0) {
      prompt += `Be aware of these topics: ${onboardingData.triggers.join(', ')}. Be sensitive when discussing these.\n`;
    }
    if (onboardingData.goals) {
      prompt += `User goals: ${onboardingData.goals}\n`;
    }
    prompt += '\n';
  }

  // Add CV context for Jobe
  if (userCV && userCV.extractedText) {
    prompt += `User's CV Context:\n${userCV.extractedText.substring(0, 1000)}\n\n`;
    if (userCV.keywords && userCV.keywords.length > 0) {
      prompt += `Key skills/experiences: ${userCV.keywords.join(', ')}\n\n`;
    }
  }

  // Add relevant knowledge entries
  if (knowledge.length > 0) {
    prompt += `Relevant Knowledge:\n`;
    knowledge.slice(0, 5).forEach((entry, idx) => {
      prompt += `${idx + 1}. ${entry.title}: ${entry.content.substring(0, 200)}\n`;
    });
    prompt += '\n';
  }

  // Add companion features
  if (features.length > 0) {
    prompt += `Available Features:\n`;
    features.slice(0, 3).forEach((feature, idx) => {
      prompt += `${idx + 1}. ${feature.name}: ${feature.description}\n`;
    });
    prompt += '\n';
  }

  // Add safety guidelines
  prompt = addSafetyGuidelinesToPrompt(prompt);

  return prompt;
}

