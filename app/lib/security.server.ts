/**
 * Security utilities and middleware
 * Provides security headers, input sanitization, and security checks
 */

import { getRequestIdentifier } from "./rate-limit.server";
import { checkRateLimit, rateLimits } from "./rate-limit.server";
import logger from "./logger.server";

/**
 * Security headers for responses
 */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": process.env.NODE_ENV === "production"
    ? "max-age=31536000; includeSubDomains; preload"
    : "",
};

/**
 * Content Security Policy
 */
export const cspHeader = process.env.NODE_ENV === "production"
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.googleapis.com; frame-src https://js.stripe.com;"
  : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https://api.stripe.com;";

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  if (cspHeader) {
    headers.set("Content-Security-Policy", cspHeader);
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, "");
}

/**
 * Check if request should be rate limited
 */
export async function checkSecurityRateLimit(
  request: Request,
  userId?: string
): Promise<{ allowed: boolean; remaining: number }> {
  const identifier = getRequestIdentifier(request, userId);
  const result = await checkRateLimit({
    ...rateLimits.api,
    identifier,
  });

  if (!result.allowed) {
    logger.warn(
      { identifier, limit: result.limit, remaining: result.remaining },
      "Rate limit exceeded"
    );
  }

  return result;
}

/**
 * Validate CSRF token (if implemented)
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple token validation - in production, use proper CSRF library
  return token === sessionToken;
}

/**
 * Check if IP is allowed (for IP whitelisting/blacklisting)
 */
export function isIPAllowed(ip: string): boolean {
  // Get blacklist from environment or database
  const blacklist = process.env.IP_BLACKLIST?.split(",") || [];
  return !blacklist.includes(ip);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash sensitive data (one-way)
 */
export function hashSensitiveData(data: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize: number;
    allowedTypes: string[];
  }
): { valid: boolean; error?: string } {
  if (file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${options.maxSize / 1024 / 1024}MB`,
    };
  }

  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}


