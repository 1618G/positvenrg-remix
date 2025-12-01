/**
 * Zod validation schemas for server-side input validation
 * Provides type-safe validation with clear error messages
 */

import { z } from "zod";
import { ValidationError } from "./errors.server";

/**
 * CUID validation (25 character alphanumeric strings starting with 'c')
 */
export const cuidSchema = z.string().length(25).regex(/^c[a-z0-9]+$/i, "Invalid CUID format");

/**
 * User ID validation
 */
export const userIdSchema = cuidSchema;

/**
 * Companion ID validation
 */
export const companionIdSchema = cuidSchema;

/**
 * Chat ID validation
 */
export const chatIdSchema = cuidSchema;

/**
 * Entry ID validation (for knowledge entries)
 */
export const entryIdSchema = cuidSchema;

/**
 * Email validation
 */
export const emailSchema = z.string().email("Invalid email format").toLowerCase().trim();

/**
 * Password validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Message content validation
 * - Minimum 1 character
 * - Maximum 10000 characters
 * - Trims whitespace
 */
export const messageSchema = z.string()
  .min(1, "Message cannot be empty")
  .max(10000, "Message cannot exceed 10000 characters")
  .trim();

/**
 * Onboarding data validation
 */
export const onboardingDataSchema = z.object({
  communicationStyle: z.string().optional(),
  responseLength: z.string().optional(),
  formality: z.string().optional(),
  tone: z.string().optional(),
  goals: z.string().optional(),
  careerContext: z.object({
    jobTitle: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    relocationOpen: z.boolean().optional(),
    remoteOnly: z.boolean().optional(),
  }).optional(),
  personalInterests: z.array(z.string()).optional(),
  learningStyle: z.array(z.string()).optional(),
  preferredFeatures: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  crisisPlan: z.string().optional(),
}).passthrough(); // Allow additional fields

/**
 * Subscription plan validation
 */
export const subscriptionPlanSchema = z.enum([
  "FREE",
  "BASIC",
  "PRO",
  "STARTER",
  "PROFESSIONAL",
  "PREMIUM",
  "TOKEN_PACK_100",
  "TOKEN_PACK_500",
  "TOKEN_PACK_1000",
]);

/**
 * Knowledge entry validation
 */
export const knowledgeEntrySchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title cannot exceed 200 characters"),
  content: z.string().min(1, "Content cannot be empty").max(50000, "Content cannot exceed 50000 characters"),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Knowledge entry update validation (all fields optional)
 */
export const knowledgeEntryUpdateSchema = knowledgeEntrySchema.partial();

/**
 * Validation helper function
 * Throws ValidationError if validation fails
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, fieldName?: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.message,
        fieldName || firstError.path.join("."),
        { errors: error.errors }
      );
    }
    throw new ValidationError("Validation failed", fieldName);
  }
}

/**
 * Safe validation helper function
 * Returns result object instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: ValidationError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const validationError = new ValidationError(
        firstError.message,
        firstError.path.join("."),
        { errors: error.errors }
      );
      return { success: false, error: validationError };
    }
    const validationError = new ValidationError("Validation failed");
    return { success: false, error: validationError };
  }
}

