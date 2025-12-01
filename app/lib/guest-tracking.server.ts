import { db } from "./db.server";
import logger from "./logger.server";
import { GUEST_CONFIG } from "./config.server";

const GUEST_CONVERSATION_LIMIT = GUEST_CONFIG.getLimit();

/**
 * Get the client's IP address from the request
 */
export function getClientIp(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP if there are multiple
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback to a default (shouldn't happen in production with proper proxies)
  return "unknown";
}

/**
 * Check if guest can use another conversation
 */
export async function canGuestUseConversation(ipAddress: string): Promise<boolean> {
  try {
    const guestUsage = await db.guestUsage.findUnique({
      where: { ipAddress },
    });
    
    if (!guestUsage) {
      // First time visitor - can use
      return true;
    }
    
    // Check if under limit
    return guestUsage.conversationCount < GUEST_CONVERSATION_LIMIT;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', ipAddress }, 'Error checking guest usage');
    // On error, allow access (fail open)
    return true;
  }
}

/**
 * Get remaining conversations for guest
 */
export async function getGuestRemainingConversations(ipAddress: string): Promise<number> {
  try {
    const guestUsage = await db.guestUsage.findUnique({
      where: { ipAddress },
    });
    
    if (!guestUsage) {
      return GUEST_CONVERSATION_LIMIT;
    }
    
    return Math.max(0, GUEST_CONVERSATION_LIMIT - guestUsage.conversationCount);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', ipAddress }, 'Error getting guest remaining');
    return GUEST_CONVERSATION_LIMIT;
  }
}

/**
 * Increment guest conversation count
 */
export async function incrementGuestConversationCount(ipAddress: string): Promise<{
  remaining: number;
  totalUsed: number;
}> {
  try {
    // Use upsert to create or update
    const guestUsage = await db.guestUsage.upsert({
      where: { ipAddress },
      update: {
        conversationCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
      create: {
        ipAddress,
        conversationCount: 1,
        lastUsedAt: new Date(),
      },
    });
    
    const remaining = Math.max(0, GUEST_CONVERSATION_LIMIT - guestUsage.conversationCount);
    
    return {
      remaining,
      totalUsed: guestUsage.conversationCount,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', ipAddress }, 'Error incrementing guest usage');
    // Return optimistic values on error
    return {
      remaining: GUEST_CONVERSATION_LIMIT - 1,
      totalUsed: 1,
    };
  }
}

/**
 * Reset guest usage (for testing or admin purposes)
 */
export async function resetGuestUsage(ipAddress: string): Promise<void> {
  try {
    await db.guestUsage.deleteMany({
      where: { ipAddress },
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', ipAddress }, 'Error resetting guest usage');
  }
}



