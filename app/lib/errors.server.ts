/**
 * Custom error classes for application-specific error handling
 * Provides structured error information with proper typing
 */

import logger from "./logger.server";

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Log the error with structured logging
   */
  log(additionalContext?: Record<string, unknown>): void {
    logger.error({
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        context: { ...this.context, ...additionalContext },
        stack: this.stack,
      },
    }, `Application error: ${this.message}`);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", 400, { field, ...context });
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication failed",
    context?: Record<string, unknown>
  ) {
    super(message, "AUTHENTICATION_ERROR", 401, context);
  }
}

/**
 * Authorization error for permission issues
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = "Access denied",
    context?: Record<string, unknown>
  ) {
    super(message, "AUTHORIZATION_ERROR", 403, context);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${resource}${identifier ? ` with id ${identifier}` : ""} not found`,
      "NOT_FOUND",
      404,
      { resource, identifier, ...context }
    );
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public readonly operation: string,
    context?: Record<string, unknown>
  ) {
    super(message, "DATABASE_ERROR", 500, { operation, ...context });
  }
}

/**
 * External service error for API/service failures (Gemini, Stripe, etc.)
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    public readonly service: string,
    public readonly originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      "EXTERNAL_SERVICE_ERROR",
      502,
      {
        service,
        originalError: originalError instanceof Error ? originalError.message : String(originalError),
        ...context,
      }
    );
  }
}

/**
 * Business logic error for business rule violations
 */
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    public readonly rule: string,
    context?: Record<string, unknown>
  ) {
    super(message, "BUSINESS_LOGIC_ERROR", 400, { rule, ...context });
  }
}

/**
 * Helper function to handle database errors
 */
export function handleDatabaseError(error: unknown, operation: string, context?: Record<string, unknown>): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  let message = "Database operation failed";
  if (error instanceof Error) {
    message = error.message;
  }

  // Check for Prisma-specific errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: unknown };
    if (prismaError.code === "P2002") {
      message = "Unique constraint violation";
    } else if (prismaError.code === "P2025") {
      message = "Record not found";
    }
  }

  return new DatabaseError(message, operation, context);
}

/**
 * Helper function to handle external service errors
 */
export function handleExternalServiceError(
  error: unknown,
  service: string,
  operation: string,
  context?: Record<string, unknown>
): ExternalServiceError {
  if (error instanceof ExternalServiceError) {
    return error;
  }

  let message = `${service} operation failed`;
  if (error instanceof Error) {
    message = error.message;
  }

  return new ExternalServiceError(message, service, error, { operation, ...context });
}

/**
 * Helper function for safe async operations
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => Error
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const handledError = errorHandler(error);
    if (handledError instanceof AppError) {
      handledError.log();
    }
    return { success: false, error: handledError };
  }
}

