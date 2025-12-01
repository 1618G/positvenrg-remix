/**
 * Reusable utility functions for common server-side patterns
 * Reduces code duplication across routes and server functions
 */

import type { User } from "./auth.server";
import { verifyUserSession, getUserById } from "./auth.server";
import { AUTH_CONFIG } from "./config.server";
import { AuthenticationError } from "./errors.server";
import { validateOrThrow, cuidSchema } from "./validation.server";

/**
 * Extract token from cookie header
 */
export function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName: string = AUTH_CONFIG.sessionCookieName
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const token = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${cookieName}=`))
    ?.split("=")[1];

  return token || null;
}

/**
 * Extract session from request and return token, session, and user
 * Throws AuthenticationError if session is invalid
 */
export async function extractSessionFromRequest(
  request: Request
): Promise<{
  token: string;
  session: { userId: string };
  user: User;
}> {
  const cookieHeader = request.headers.get("Cookie");
  const token = extractTokenFromCookie(cookieHeader);

  if (!token) {
    throw new AuthenticationError("No session token found");
  }

  const session = verifyUserSession(token);
  if (!session) {
    throw new AuthenticationError("Invalid session token");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return { token, session, user };
}

/**
 * Extract session from request (safe version that returns null instead of throwing)
 */
export async function extractSessionFromRequestSafe(
  request: Request
): Promise<{
  token: string;
  session: { userId: string };
  user: User;
} | null> {
  try {
    return await extractSessionFromRequest(request);
  } catch {
    return null;
  }
}

/**
 * Validate CUID format
 * Throws ValidationError if invalid
 */
export function validateCuid(value: string, fieldName: string): void {
  validateOrThrow(cuidSchema, value, fieldName);
}

/**
 * Sanitize message content
 * - Trims whitespace
 * - Enforces max length
 * - Removes control characters (except newlines and tabs)
 */
export function sanitizeMessage(message: string, maxLength: number = 10000): string {
  return message
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Remove control chars except \n and \t
}

