import Redis from "ioredis";
import { getEnv } from "./env.server";
import logger from "./logger.server";

let redis: Redis | null = null;

/**
 * Get or create Redis client instance
 * Returns null if Redis is not configured (graceful degradation)
 */
function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  const redisUrl = getEnv("REDIS_URL", "");
  
  if (!redisUrl) {
    // Redis is optional - return null for graceful degradation
    if (process.env.NODE_ENV === "production") {
      logger.warn({}, "Redis URL not configured - caching disabled");
    }
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on("error", (error) => {
      logger.error({ error: error.message }, "Redis connection error");
    });

    redis.on("connect", () => {
      logger.info({}, "Redis connected");
    });

    redis.on("ready", () => {
      logger.info({}, "Redis ready");
    });

    return redis;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Failed to create Redis client");
    return null;
  }
}

/**
 * Get cached value by key
 * Returns null if not found or Redis is unavailable
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", key },
      "Error getting cached value"
    );
    return null;
  }
}

/**
 * Set cached value with optional TTL (time to live) in seconds
 * Default TTL: 1 hour (3600 seconds)
 */
export async function setCached(
  key: string,
  value: unknown,
  ttl: number = 3600
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    await client.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", key },
      "Error setting cached value"
    );
    return false;
  }
}

/**
 * Delete cached value by key
 */
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", key },
      "Error deleting cached value"
    );
    return false;
  }
}

/**
 * Delete multiple cached values by pattern
 * Use with caution - can be slow on large datasets
 */
export async function deleteCachedByPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await client.del(...keys);
    return keys.length;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", pattern },
      "Error deleting cached values by pattern"
    );
    return 0;
  }
}

/**
 * Increment a cached counter
 * Useful for rate limiting and counters
 */
export async function incrementCounter(
  key: string,
  ttl?: number
): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const count = await client.incr(key);
    if (ttl && count === 1) {
      // Set TTL only on first increment
      await client.expire(key, ttl);
    }
    return count;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", key },
      "Error incrementing counter"
    );
    return 0;
  }
}

/**
 * Get counter value
 */
export async function getCounter(key: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const value = await client.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", key },
      "Error getting counter"
    );
    return 0;
  }
}

/**
 * Cache key generators for common use cases
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userSubscription: (userId: string) => `subscription:${userId}`,
  companion: (companionId: string) => `companion:${companionId}`,
  humanCompanion: (companionId: string) => `human_companion:${companionId}`,
  companionList: (filters?: string) => `companions:list${filters ? `:${filters}` : ""}`,
  chat: (chatId: string) => `chat:${chatId}`,
  chatHistory: (chatId: string, limit?: number) => `chat:${chatId}:history${limit ? `:${limit}` : ""}`,
  rateLimit: (identifier: string, window: string) => `ratelimit:${identifier}:${window}`,
  appointment: (appointmentId: string) => `appointment:${appointmentId}`,
  availability: (companionId: string, date: string) => `availability:${companionId}:${date}`,
};

/**
 * Default TTL values (in seconds)
 */
export const cacheTTL = {
  user: 3600, // 1 hour
  subscription: 1800, // 30 minutes
  companion: 7200, // 2 hours
  chat: 1800, // 30 minutes
  chatHistory: 900, // 15 minutes
  appointment: 3600, // 1 hour
  availability: 300, // 5 minutes
  rateLimit: 60, // 1 minute
};

