/**
 * Centralized configuration constants
 * Replaces hardcoded values throughout the application
 */

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default provided.`);
  }
  return value || defaultValue || "";
}

/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  jwtExpiration: getEnv("JWT_EXPIRATION", "7d"),
  sessionCookieName: "token",
  tempSessionCookieName: "temp_signup_token",
} as const;

/**
 * API client configuration
 */
export const API_CONFIG = {
  retryDelay: 1000, // 1 second
  defaultTimeout: 30000, // 30 seconds
  geminiTimeout: 5000, // 5 seconds
  maxRetries: 3,
} as const;

/**
 * Safety and moderation configuration
 */
export const SAFETY_CONFIG = {
  messagePreviewLength: 500, // Characters to log for safety monitoring
  maxOutputTokens: 1000, // Maximum tokens for AI safety analysis
  maxMessageLength: 10000, // Maximum message length allowed
} as const;

/**
 * Subscription and billing configuration
 */
export const SUBSCRIPTION_CONFIG = {
  planAmounts: {
    STARTER: 1000, // £10.00 in pence
    PROFESSIONAL: 2000, // £20.00 in pence
    PREMIUM: 5000, // £50.00 in pence
  },
  planInteractions: {
    STARTER: 1000,
    PROFESSIONAL: 2500,
    PREMIUM: null, // unlimited
  },
  tokenPackSizes: {
    SMALL: 100,
    MEDIUM: 500,
    LARGE: 1000,
  },
  billingPeriodDays: 30, // Standard billing period
  trialPeriodDays: 7, // Trial period for new subscriptions
} as const;

/**
 * Guest user configuration
 */
export const GUEST_CONFIG = {
  conversationLimit: {
    development: 1000,
    production: 10,
  },
  getLimit() {
    const isDevelopment = !process.env.NODE_ENV || 
                          process.env.NODE_ENV === "development" || 
                          process.env.NODE_ENV === "test";
    return isDevelopment 
      ? GUEST_CONFIG.conversationLimit.development 
      : GUEST_CONFIG.conversationLimit.production;
  },
} as const;

/**
 * Memory and conversation configuration
 */
export const MEMORY_CONFIG = {
  summaryGeneration: {
    initialMessageCount: 5, // Generate first summary after N messages
    recurringMessageCount: 10, // Generate recurring summaries every N messages
    timeThresholdHours: 24, // Generate summary if 24 hours passed
  },
  cleanup: {
    summaryRetentionDays: 30, // Keep summaries for 30 days
  },
  messageHistory: {
    maxRecentMessages: 50, // Maximum messages to load in chat
    contextWindow: 10, // Messages to include in context
  },
} as const;

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  verification: {
    tokenExpiryHours: 24,
    codeRange: {
      min: 100000,
      max: 999999,
    },
  },
  magicLink: {
    tokenExpiryHours: 1, // Magic links expire after 1 hour
  },
} as const;

/**
 * Performance and monitoring configuration
 */
export const PERFORMANCE_CONFIG = {
  slowQueryThreshold: 1000, // Milliseconds
  slowResponseThreshold: 2000, // Milliseconds
  responseTimeConversion: 1000, // Convert ms to seconds
} as const;

/**
 * Application-wide constants
 */
export const APP_CONFIG = {
  baseUrl: getEnv("BASE_URL", "http://localhost:8780"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  defaultPort: 8780,
} as const;

