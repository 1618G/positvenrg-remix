import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "~/lib/db.server";
import {
  checkAvailability,
  createAppointment,
  calculateAppointmentAmount,
  calculateEarnings,
} from "~/lib/appointment.server";
import { ValidationError } from "~/lib/errors.server";

// Mock dependencies
vi.mock("~/lib/db.server", () => ({
  db: {
    humanCompanion: {
      findUnique: vi.fn(),
    },
    appointment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("~/lib/cache.server", () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  deleteCached: vi.fn(),
}));

vi.mock("~/lib/google-calendar.server", () => ({
  syncAvailabilityFromCalendar: vi.fn(() => []),
  createCalendarEvent: vi.fn(() => "event-id"),
}));

vi.mock("~/lib/logger.server", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Appointment Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAvailability", () => {
    it("should return available if no conflicts", async () => {
      const companionId = "companion-id";
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T11:00:00Z");

      const mockCompanion = {
        id: companionId,
        isActive: true,
        isAvailable: true,
        calendarSyncEnabled: false,
        availabilitySchedule: {},
        timezone: "Europe/London",
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);
      vi.mocked(db.appointment.findFirst).mockResolvedValue(null);

      const result = await checkAvailability(companionId, startTime, endTime);

      expect(result.available).toBe(true);
    });

    it("should return unavailable if companion is inactive", async () => {
      const companionId = "companion-id";
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T11:00:00Z");

      const mockCompanion = {
        id: companionId,
        isActive: false,
        isAvailable: true,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);

      const result = await checkAvailability(companionId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should return unavailable if time slot is booked", async () => {
      const companionId = "companion-id";
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T11:00:00Z");

      const mockCompanion = {
        id: companionId,
        isActive: true,
        isAvailable: true,
      };

      const conflictingAppointment = {
        id: "appointment-id",
        startTime,
        endTime,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);
      vi.mocked(db.appointment.findFirst).mockResolvedValue(conflictingAppointment as any);

      const result = await checkAvailability(companionId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toContain("already booked");
    });
  });

  describe("createAppointment", () => {
    it("should create appointment with valid data", async () => {
      const appointmentData = {
        userId: "user-id",
        companionId: "companion-id",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T11:00:00Z"),
        duration: 60,
        timezone: "Europe/London",
        meetingType: "VIDEO_CALL" as const,
        amount: 5000,
        currency: "GBP",
      };

      const mockCompanion = {
        id: "companion-id",
        isActive: true,
        isAvailable: true,
        pricePerHour: 5000,
        minimumDuration: 30,
        calendarSyncEnabled: false,
        availabilitySchedule: {},
        timezone: "Europe/London",
      };

      const mockAppointment = {
        id: "appointment-id",
        ...appointmentData,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);
      vi.mocked(db.appointment.findFirst).mockResolvedValue(null);
      vi.mocked(db.appointment.create).mockResolvedValue(mockAppointment as any);

      const result = await createAppointment(appointmentData);

      expect(result.id).toBe("appointment-id");
      expect(db.appointment.create).toHaveBeenCalled();
    });

    it("should throw error if duration is below minimum", async () => {
      const appointmentData = {
        userId: "user-id",
        companionId: "companion-id",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T10:15:00Z"),
        duration: 15, // Below minimum
        timezone: "Europe/London",
        meetingType: "VIDEO_CALL" as const,
        amount: 5000,
      };

      const mockCompanion = {
        id: "companion-id",
        isActive: true,
        pricePerHour: 5000,
        minimumDuration: 30,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);
      vi.mocked(db.appointment.findFirst).mockResolvedValue(null);

      await expect(createAppointment(appointmentData)).rejects.toThrow(ValidationError);
    });
  });

  describe("calculateAppointmentAmount", () => {
    it("should calculate correct amount for 1 hour", () => {
      const amount = calculateAppointmentAmount(60, 5000); // 60 minutes, £50/hour
      expect(amount).toBe(5000);
    });

    it("should calculate correct amount for 30 minutes", () => {
      const amount = calculateAppointmentAmount(30, 5000);
      expect(amount).toBe(2500);
    });

    it("should round to nearest integer", () => {
      const amount = calculateAppointmentAmount(45, 5000); // 45 minutes = 0.75 hours
      expect(amount).toBe(3750);
    });
  });

  describe("calculateEarnings", () => {
    it("should calculate platform fee and net amount correctly", () => {
      const amount = 5000; // £50
      const { platformFee, netAmount } = calculateEarnings(amount);

      expect(platformFee).toBe(1000); // 20% of 5000
      expect(netAmount).toBe(4000); // 80% of 5000
    });

    it("should round amounts correctly", () => {
      const amount = 3333;
      const { platformFee, netAmount } = calculateEarnings(amount);

      expect(platformFee + netAmount).toBe(amount);
    });
  });
});

