import { db } from "./db.server";
import type { SubscriptionMetadata } from "./types.server";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { SUBSCRIPTION_CONFIG } from "./config.server";
import { validateOrThrow, userIdSchema, subscriptionPlanSchema } from "./validation.server";

export async function createDefaultSubscription(userId: string) {
  // Check if subscription already exists
  const existing = await db.subscription.findUnique({
    where: { userId },
  });
  
  if (existing) {
    return existing;
  }
  
  // Create free tier subscription with initial tokens
  const subscription = await db.subscription.create({
    data: {
      userId,
      planType: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      tokensRemaining: 10, // Free tier gets 10 tokens to start
      messagesAllowed: 20, // Free tier: 20 messages per month
      messagesUsed: 0,
      interactionsAllowed: null, // Free tier has no interaction limit (uses guest limit)
      interactionsUsed: 0,
    },
  });
  
  return subscription;
}

export async function getUserSubscription(userId: string) {
  let subscription = await db.subscription.findUnique({
    where: { userId },
  });
  
  // Create default subscription if doesn't exist
  if (!subscription) {
    subscription = await createDefaultSubscription(userId);
  }
  
  return subscription;
}

export async function checkCanUseTokens(userId: string, tokensNeeded: number = 1): Promise<boolean> {
  validateOrThrow(userIdSchema, userId, "userId");
  const subscription = await getUserSubscription(userId);
  
  // For subscription plans, check message limits
  if (subscription.planType !== SubscriptionPlan.FREE && 
      subscription.planType !== SubscriptionPlan.TOKEN_PACK_100 &&
      subscription.planType !== SubscriptionPlan.TOKEN_PACK_500 &&
      subscription.planType !== SubscriptionPlan.TOKEN_PACK_1000) {
    
    // Check if user has messages remaining
    if (subscription.messagesAllowed && subscription.messagesUsed >= subscription.messagesAllowed) {
      // Check if we need to reset for new period
      if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
        // Period expired, reset usage
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            messagesUsed: 0,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + SUBSCRIPTION_CONFIG.billingPeriodDays * 24 * 60 * 60 * 1000),
          },
        });
        return true;
      }
      return false;
    }
    return true;
  }
  
  // For token-based plans or free tier
  return subscription.tokensRemaining >= tokensNeeded;
}

export async function consumeTokens(
  userId: string,
  tokensUsed: number,
  metadata?: {
    chatId?: string;
    messageId?: string;
    actionType?: string;
    modelUsed?: string;
    responseLength?: number;
    cost?: number;
  }
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  // Check if user can use tokens
  if (!(await checkCanUseTokens(userId, tokensUsed))) {
    return false;
  }
  
  // Update subscription
  if (subscription.planType === SubscriptionPlan.FREE ||
      subscription.planType === SubscriptionPlan.TOKEN_PACK_100 ||
      subscription.planType === SubscriptionPlan.TOKEN_PACK_500 ||
      subscription.planType === SubscriptionPlan.TOKEN_PACK_1000) {
    // Token-based: deduct tokens
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        tokensRemaining: {
          decrement: tokensUsed,
        },
      },
    });
  } else {
    // Subscription-based: increment message count
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        messagesUsed: {
          increment: 1,
        },
      },
    });
  }
  
  // Log usage
  await db.usageLog.create({
    data: {
      userId,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
      actionType: (metadata as SubscriptionMetadata)?.actionType || "CHAT_MESSAGE",
      tokensUsed,
      modelUsed: metadata?.modelUsed,
      responseLength: metadata?.responseLength,
      cost: metadata?.cost,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
  
  return true;
}

// Estimate token usage based on message length (rough estimate)
export function estimateTokens(messageLength: number): number {
  // Rough estimate: ~4 characters per token for English text
  // Add overhead for system prompts and context
  return Math.ceil(messageLength / 4) + 50; // Add 50 tokens for overhead
}

// Estimate cost in USD (Gemini Flash pricing as of 2024)
export function estimateCost(tokens: number, model: string = "gemini-2.5-flash"): number {
  // Gemini Flash pricing (approximate):
  // Input: $0.075 per 1M tokens
  // Output: $0.30 per 1M tokens
  // Using average of input/output: ~$0.1875 per 1M tokens
  const costPerMillionTokens = 0.1875;
  return (tokens / 1_000_000) * costPerMillionTokens;
}

/**
 * Check if user can make an interaction (1 message exchange)
 */
export async function checkInteractionLimit(userId: string): Promise<{
  allowed: boolean;
  remaining?: number;
  limit?: number;
  error?: string;
}> {
  const subscription = await getUserSubscription(userId);

  // Premium plan has unlimited interactions
  if (subscription.planType === SubscriptionPlan.PREMIUM) {
    return { allowed: true, remaining: null, limit: null };
  }

  // Check if subscription has interaction limits
  if (subscription.interactionsAllowed === null) {
    // Free tier or no limit - allow
    return { allowed: true };
  }

  // Check if period has expired (reset interactions)
  if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        interactionsUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    return { allowed: true, remaining: subscription.interactionsAllowed, limit: subscription.interactionsAllowed };
  }

  // Check if user has interactions remaining
  if (subscription.interactionsUsed >= subscription.interactionsAllowed) {
    return {
      allowed: false,
      remaining: 0,
      limit: subscription.interactionsAllowed,
      error: "You've reached your monthly interaction limit. Please upgrade your plan.",
    };
  }

  return {
    allowed: true,
    remaining: subscription.interactionsAllowed - subscription.interactionsUsed,
    limit: subscription.interactionsAllowed,
  };
}

/**
 * Consume one interaction (message exchange)
 */
export async function consumeInteraction(
  userId: string,
  metadata?: {
    chatId?: string;
    messageId?: string;
    modelUsed?: string;
    tokensUsed?: number;
    cost?: number;
  }
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  // Premium plan - unlimited, just log usage
  if (subscription.planType === SubscriptionPlan.PREMIUM) {
    await logInteraction(userId, metadata);
    return true;
  }

  // Check interaction limit
  const limitCheck = await checkInteractionLimit(userId);
  if (!limitCheck.allowed) {
    return false;
  }

  // Update interaction count
  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      interactionsUsed: {
        increment: 1,
      },
    },
  });

  // Also update token usage for tracking
  if (metadata?.tokensUsed) {
    await consumeTokens(userId, metadata.tokensUsed, metadata);
  } else {
    await logInteraction(userId, metadata);
  }

  return true;
}

/**
 * Log interaction usage
 */
async function logInteraction(
  userId: string,
  metadata?: {
    chatId?: string;
    messageId?: string;
    modelUsed?: string;
    tokensUsed?: number;
    cost?: number;
  }
): Promise<void> {
  await db.usageLog.create({
    data: {
      userId,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
      actionType: "CHAT_MESSAGE",
      tokensUsed: metadata?.tokensUsed || 0,
      modelUsed: metadata?.modelUsed,
      cost: metadata?.cost,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}
