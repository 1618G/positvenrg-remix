/**
 * Shared type definitions for server-side code
 * Replaces `as any` type assertions with proper types
 */

/**
 * Message metadata stored in JSON format
 */
export interface MessageMetadata {
  sentiment?: string;
  keywords?: string[];
  crisisDetected?: boolean;
  knowledgeUsed?: string[];
  featuresSuggested?: string[];
  [key: string]: unknown; // Allow additional properties
}

/**
 * CV Document metadata
 */
export interface CVDocumentMetadata {
  extractedText?: string;
  keywords?: string[];
  filename?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Onboarding data stored in JSON format
 */
export interface OnboardingData {
  communicationStyle?: string;
  responseLength?: string;
  formality?: string;
  primaryNeeds?: string[];
  triggers?: string[];
  goals?: string;
  careerContext?: {
    industry?: string;
    experienceLevel?: string;
    currentSituation?: string;
    careerGoals?: string;
    location?: string;
    relocationOpen?: boolean;
    visaConsiderations?: boolean;
    jobTitle?: string;
  };
  [key: string]: unknown; // Allow additional properties
}

/**
 * Subscription metadata
 */
export interface SubscriptionMetadata {
  actionType?: "CHAT_MESSAGE" | "CONVERSATION_SUMMARY" | "MEMORY_UPDATE" | "KNOWLEDGE_SEARCH";
  chatId?: string;
  messageId?: string;
  modelUsed?: string;
  responseLength?: number;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Moderation flag types
 */
export interface ModerationFlag {
  type: 'harmful' | 'inappropriate' | 'spam' | 'violence' | 'self-harm' | 'medical-advice' | 'profanity' | 'harassment';
  severity: 'low' | 'medium' | 'high';
  reason: string;
  confidence: number;
}

/**
 * Prisma enum types (matching schema.prisma)
 */
export type SubscriptionPlan = 
  | "FREE"
  | "BASIC"
  | "PRO"
  | "STARTER"
  | "PROFESSIONAL"
  | "PREMIUM"
  | "TOKEN_PACK_100"
  | "TOKEN_PACK_500"
  | "TOKEN_PACK_1000";

export type SubscriptionStatus = 
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "INCOMPLETE";

/**
 * Companion training data
 */
export interface TrainingData {
  therapeuticApproach?: string;
  conversationFlows?: Record<string, string[]>;
  emotionalIntelligence?: {
    triggers?: string[];
    responses?: Record<string, string>;
  };
  specializedKnowledge?: Record<string, boolean>;
  crisisProtocols?: Record<string, string>;
  conversationStarters?: string[];
  responsePatterns?: string[];
  personalityTraits?: string[];
  specializations?: string[];
  careerStages?: string[];
  industries?: string[];
  [key: string]: unknown; // Allow additional properties
}

/**
 * Google Generative AI content types
 * These are part of the @google/generative-ai SDK
 */
export interface GenerativeContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

