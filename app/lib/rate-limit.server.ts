import { incrementCounter, getCounter, cacheKeys, cacheTTL } from "./cache.server";
import logger from "./logger.server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export interface RateLimitConfig {
  limit: number; // Maximum requests
  window: number; // Time window in seconds
  identifier: string; // Unique identifier (userId, IP, etc.)
}

/**
 * Check if a request is within rate limits
 * Uses Redis for distributed rate limiting, falls back to in-memory if Redis unavailable
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, window, identifier } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / window);
  const cacheKey = cacheKeys.rateLimit(identifier, `${windowKey}:${window}`);

  try {
    const count = await incrementCounter(cacheKey, window);
    const remaining = Math.max(0, limit - count);
    const resetAt = new Date((windowKey + 1) * window * 1000);

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
      limit,
    };
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", identifier },
      "Rate limit check failed - allowing request"
    );
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + window * 1000),
      limit,
    };
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, window, identifier } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / window);
  const cacheKey = cacheKeys.rateLimit(identifier, `${windowKey}:${window}`);

  try {
    const count = await getCounter(cacheKey);
    const remaining = Math.max(0, limit - count);
    const resetAt = new Date((windowKey + 1) * window * 1000);

    return {
      allowed: count < limit,
      remaining,
      resetAt,
      limit,
    };
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", identifier },
      "Rate limit status check failed"
    );
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + window * 1000),
      limit,
    };
  }
}

/**
 * Pre-configured rate limit configurations
 */
export const rateLimits = {
  // API endpoints
  api: {
    limit: 100,
    window: 60, // 100 requests per minute
  },
  
  // Chat messages
  chat: {
    limit: 10,
    window: 60, // 10 messages per minute
  },
  
  // Authentication
  login: {
    limit: 5,
    window: 900, // 5 attempts per 15 minutes
  },
  
  register: {
    limit: 3,
    window: 3600, // 3 registrations per hour
  },
  
  // Password reset
  passwordReset: {
    limit: 3,
    window: 3600, // 3 attempts per hour
  },
  
  // Email verification
  emailVerification: {
    limit: 5,
    window: 3600, // 5 attempts per hour
  },
  
  // Appointment booking
  booking: {
    limit: 10,
    window: 300, // 10 bookings per 5 minutes
  },
  
  // Companion registration
  companionRegistration: {
    limit: 1,
    window: 86400, // 1 registration per day
  },
};

/**
 * Create rate limit middleware for Remix loaders/actions
 */
export function createRateLimitMiddleware(
  config: Omit<RateLimitConfig, "identifier">,
  getIdentifier: (request: Request) => Promise<string> | string
) {
  return async (request: Request): Promise<RateLimitResult> => {
    const identifier = await getIdentifier(request);
    return checkRateLimit({
      ...config,
      identifier,
    });
  };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP address from headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp.trim()}`;
  }
  
  // Fallback
  return "ip:unknown";
}

