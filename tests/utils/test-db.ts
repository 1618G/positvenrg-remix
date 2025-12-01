import { PrismaClient } from "@prisma/client";

/**
 * Test database utilities
 * Provides isolated test database for integration tests
 */

let testDb: PrismaClient | null = null;

/**
 * Get or create test database client
 * Uses a separate test database to avoid affecting development data
 */
export function getTestDb(): PrismaClient {
  if (testDb) {
    return testDb;
  }

  const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for tests");
  }

  testDb = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
    log: process.env.DEBUG_TESTS ? ["query", "error", "warn"] : ["error"],
  });

  return testDb;
}

/**
 * Clean up test database (truncate all tables)
 * Use with caution - only in test environment
 */
export async function cleanupTestDb(): Promise<void> {
  const db = getTestDb();
  
  // Delete in reverse order of dependencies
  await db.companionEarning.deleteMany();
  await db.companionReview.deleteMany();
  await db.appointment.deleteMany();
  await db.humanCompanion.deleteMany();
  await db.usageLog.deleteMany();
  await db.userDocument.deleteMany();
  await db.safetyLog.deleteMany();
  await db.crisisLog.deleteMany();
  await db.conversationSummary.deleteMany();
  await db.message.deleteMany();
  await db.chat.deleteMany();
  await db.companionKnowledge.deleteMany();
  await db.userPreference.deleteMany();
  await db.subscription.deleteMany();
  await db.guestUsage.deleteMany();
  await db.companion.deleteMany();
  await db.user.deleteMany();
}

/**
 * Seed test database with minimal data
 */
export async function seedTestDb(): Promise<void> {
  const db = getTestDb();
  
  // Create test user
  const testUser = await db.user.create({
    data: {
      email: "test@example.com",
      password: "hashed_password", // In real tests, use bcrypt
      name: "Test User",
    },
  });

  // Create test companion
  await db.companion.create({
    data: {
      name: "TestCompanion",
      description: "Test companion for testing",
      personality: "helpful, friendly",
      avatar: "🤖",
      isActive: true,
    },
  });

  return testUser as any;
}

/**
 * Reset test database (cleanup + seed)
 */
export async function resetTestDb(): Promise<void> {
  await cleanupTestDb();
  await seedTestDb();
}

/**
 * Close test database connection
 */
export async function closeTestDb(): Promise<void> {
  if (testDb) {
    await testDb.$disconnect();
    testDb = null;
  }
}

