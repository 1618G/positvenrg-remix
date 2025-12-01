import { db } from "~/lib/db.server";
import type { User, Companion, Chat } from "@prisma/client";

/**
 * Test helper functions for creating test data
 */

export interface TestUserData {
  email: string;
  password: string;
  name?: string;
}

export interface TestCompanionData {
  name: string;
  description?: string;
  personality?: string;
  avatar?: string;
}

/**
 * Create a test user
 */
export async function createTestUser(data: TestUserData): Promise<User> {
  return await db.user.create({
    data: {
      email: data.email,
      password: data.password, // Should be hashed in real scenarios
      name: data.name,
    },
  });
}

/**
 * Create a test companion
 */
export async function createTestCompanion(data: TestCompanionData): Promise<Companion> {
  return await db.companion.create({
    data: {
      name: data.name,
      description: data.description || "Test companion",
      personality: data.personality || "helpful",
      avatar: data.avatar || "🤖",
      isActive: true,
    },
  });
}

/**
 * Create a test chat
 */
export async function createTestChat(userId: string, companionId: string): Promise<Chat> {
  return await db.chat.create({
    data: {
      userId,
      companionId,
      title: "Test Chat",
      isActive: true,
    },
  });
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Wait for a specified time (useful for async operations in tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock request object for testing
 */
export function createMockRequest(
  method: string = "GET",
  url: string = "http://localhost:8780/",
  headers: Record<string, string> = {},
  body?: unknown
): Request {
  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
    requestInit.headers?.set("Content-Type", "application/json");
  }

  return new Request(url, requestInit);
}

/**
 * Create authenticated request with JWT token
 */
export function createAuthenticatedRequest(
  token: string,
  method: string = "GET",
  url: string = "http://localhost:8780/",
  body?: unknown
): Request {
  return createMockRequest(method, url, {
    Cookie: `token=${token}`,
  }, body);
}

