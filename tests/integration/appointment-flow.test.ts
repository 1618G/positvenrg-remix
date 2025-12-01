import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { cleanupTestDb, seedTestDb, closeTestDb, getTestDb } from "../utils/test-db";

describe("Appointment Flow Integration", () => {
  let db: ReturnType<typeof getTestDb>;
  let createUser: any;
  let createCompanionProfile: any;
  let createAppointment: any;
  let checkAvailability: any;

  beforeEach(async () => {
    // Dynamic imports to avoid Remix server-only module restrictions
    db = getTestDb();
    const authModule = await import("../../app/lib/auth.server");
    const companionModule = await import("../../app/lib/companion.server");
    const appointmentModule = await import("../../app/lib/appointment.server");
    
    createUser = authModule.createUser;
    createCompanionProfile = companionModule.createCompanionProfile;
    createAppointment = appointmentModule.createAppointment;
    checkAvailability = appointmentModule.checkAvailability;

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

  it.skip("should create and retrieve appointment", async () => {
    // Create user
    const user = await createUser(
      "test@example.com",
      "TestPassword123",
      "Test User"
    );

    // Create companion
    const { id: companionId } = await createCompanionProfile(user.id, {
      displayName: "Test Companion",
      timezone: "Europe/London",
      pricePerHour: 5000,
      currency: "GBP",
      minimumDuration: 30,
    });

    // Check availability
    const startTime = new Date("2024-12-25T10:00:00Z");
    const endTime = new Date("2024-12-25T11:00:00Z");

    const availability = await checkAvailability(companionId, startTime, endTime);
    expect(availability.available).toBe(true);

    // Create appointment
    const { id: appointmentId } = await createAppointment({
      userId: user.id,
      companionId,
      startTime,
      endTime,
      duration: 60,
      timezone: "Europe/London",
      meetingType: "VIDEO_CALL",
      amount: 5000,
      currency: "GBP",
    });

    expect(appointmentId).toBeDefined();

    // Verify appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    expect(appointment).toBeDefined();
    expect(appointment?.userId).toBe(user.id);
    expect(appointment?.companionId).toBe(companionId);
    expect(appointment?.status).toBe("PENDING");
  });

  it.skip("should prevent double booking", async () => {
    const user = await createUser(
      "test2@example.com",
      "TestPassword123",
      "Test User 2"
    );

    const { id: companionId } = await createCompanionProfile(user.id, {
      displayName: "Test Companion 2",
      timezone: "Europe/London",
      pricePerHour: 5000,
      currency: "GBP",
      minimumDuration: 30,
    });

    const startTime = new Date("2024-12-25T10:00:00Z");
    const endTime = new Date("2024-12-25T11:00:00Z");

    // Create first appointment
    await createAppointment({
      userId: user.id,
      companionId,
      startTime,
      endTime,
      duration: 60,
      timezone: "Europe/London",
      meetingType: "VIDEO_CALL",
      amount: 5000,
      currency: "GBP",
    });

    // Try to create overlapping appointment
    const availability = await checkAvailability(companionId, startTime, endTime);
    expect(availability.available).toBe(false);
    expect(availability.reason).toContain("already booked");
  });
});

