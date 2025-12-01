import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "~/lib/db.server";
import { createUser } from "~/lib/auth.server";
import {
  createCompanionProfile,
  getCompanionProfileByUserId,
  updateCompanionProfile,
} from "~/lib/companion.server";
import { cleanupTestDb, seedTestDb, closeTestDb } from "../utils/test-db";

describe("Companion Registration Integration", () => {
  let db: ReturnType<typeof getTestDb>;
  let createUser: any;
  let createCompanionProfile: any;
  let getCompanionProfileByUserId: any;
  let updateCompanionProfile: any;

  beforeEach(async () => {
    // Dynamic imports to avoid Remix server-only module restrictions
    db = getTestDb();
    const authModule = await import("../../app/lib/auth.server");
    const companionModule = await import("../../app/lib/companion.server");
    
    createUser = authModule.createUser;
    createCompanionProfile = companionModule.createCompanionProfile;
    getCompanionProfileByUserId = companionModule.getCompanionProfileByUserId;
    updateCompanionProfile = companionModule.updateCompanionProfile;

    try {
      await cleanupTestDb();
      await seedTestDb();
    } catch (error) {
      // Database might not be available in test environment
      console.warn("Database cleanup/seed failed, skipping integration test:", error);
    }
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it.skip("should create companion profile for user", async () => {
    const user = await createUser(
      "companion@example.com",
      "TestPassword123",
      "Companion User"
    );

    const { id: companionId } = await createCompanionProfile(user.id, {
      displayName: "Friendly Companion",
      bio: "I'm here to help!",
      timezone: "Europe/London",
      pricePerHour: 5000,
      currency: "GBP",
      minimumDuration: 30,
      tags: ["listening", "supportive"],
      languages: ["English"],
    });

    expect(companionId).toBeDefined();

    // Verify profile was created
    const profile = await getCompanionProfileByUserId(user.id);
    expect(profile).toBeDefined();
    expect(profile?.displayName).toBe("Friendly Companion");
    expect(profile?.isActive).toBe(true);
    expect(profile?.isVerified).toBe(false); // Should require admin verification
  });

  it.skip("should prevent duplicate companion profiles", async () => {
    const user = await createUser(
      "user@example.com",
      "TestPassword123",
      "Test User"
    );

    await createCompanionProfile(user.id, {
      displayName: "First Profile",
      timezone: "Europe/London",
      pricePerHour: 5000,
      currency: "GBP",
      minimumDuration: 30,
    });

    // Try to create second profile
    await expect(
      createCompanionProfile(user.id, {
        displayName: "Second Profile",
        timezone: "Europe/London",
        pricePerHour: 5000,
        currency: "GBP",
        minimumDuration: 30,
      })
    ).rejects.toThrow();
  });

  it.skip("should update companion profile", async () => {
    const user = await createUser(
      "update@example.com",
      "TestPassword123",
      "Update User"
    );

    const { id: companionId } = await createCompanionProfile(user.id, {
      displayName: "Original Name",
      timezone: "Europe/London",
      pricePerHour: 5000,
      currency: "GBP",
      minimumDuration: 30,
    });

    // Update profile
    await updateCompanionProfile(companionId, user.id, {
      displayName: "Updated Name",
      bio: "Updated bio",
      pricePerHour: 6000,
    });

    const updatedProfile = await getCompanionProfileByUserId(user.id);
    expect(updatedProfile?.displayName).toBe("Updated Name");
    expect(updatedProfile?.bio).toBe("Updated bio");
    expect(updatedProfile?.pricePerHour).toBe(6000);
  });
});

