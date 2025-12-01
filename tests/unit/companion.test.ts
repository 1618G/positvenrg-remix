import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "~/lib/db.server";
import {
  createCompanionProfile,
  getCompanionProfile,
  updateCompanionProfile,
  getActiveCompanions,
} from "~/lib/companion.server";
import { ValidationError } from "~/lib/errors.server";

// Mock dependencies
vi.mock("~/lib/db.server", () => ({
  db: {
    humanCompanion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("~/lib/cache.server", () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  deleteCached: vi.fn(),
  cacheKeys: {
    humanCompanion: (id: string) => `human_companion:${id}`,
    companionList: (filters?: string) => `companions:list${filters ? `:${filters}` : ""}`,
  },
  cacheTTL: {
    companion: 7200,
  },
}));

vi.mock("~/lib/logger.server", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Companion Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCompanionProfile", () => {
    it("should create a companion profile with valid data", async () => {
      const userId = "test-user-id";
      const profileData = {
        displayName: "Test Companion",
        bio: "A test companion",
        timezone: "Europe/London",
        pricePerHour: 5000,
        currency: "GBP",
        minimumDuration: 30,
      };

      const mockCompanion = {
        id: "companion-id",
        ...profileData,
        userId,
        isActive: true,
        isVerified: false,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(null);
      vi.mocked(db.humanCompanion.create).mockResolvedValue(mockCompanion as any);

      const result = await createCompanionProfile(userId, profileData);

      expect(result.id).toBe("companion-id");
      expect(db.humanCompanion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayName: profileData.displayName,
          userId,
          isActive: true,
          isVerified: false,
        }),
      });
    });

    it("should throw error if user already has a companion profile", async () => {
      const userId = "test-user-id";
      const existingProfile = { id: "existing-id", userId };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(existingProfile as any);

      await expect(
        createCompanionProfile(userId, {
          displayName: "Test",
          timezone: "Europe/London",
          pricePerHour: 5000,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should validate minimum price per hour", async () => {
      const userId = "test-user-id";

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(null);

      await expect(
        createCompanionProfile(userId, {
          displayName: "Test",
          timezone: "Europe/London",
          pricePerHour: 50, // Below minimum of 100
        })
      ).rejects.toThrow();
    });
  });

  describe("getCompanionProfile", () => {
    it("should return companion profile by ID", async () => {
      const companionId = "companion-id";
      const mockCompanion = {
        id: companionId,
        displayName: "Test Companion",
        isActive: true,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(mockCompanion as any);

      const result = await getCompanionProfile(companionId);

      expect(result).toEqual(mockCompanion);
      expect(db.humanCompanion.findUnique).toHaveBeenCalledWith({
        where: { id: companionId },
        include: expect.any(Object),
      });
    });

    it("should return null if companion not found", async () => {
      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(null);

      const result = await getCompanionProfile("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("updateCompanionProfile", () => {
    it("should update companion profile", async () => {
      const companionId = "companion-id";
      const userId = "user-id";
      const updates = {
        displayName: "Updated Name",
        bio: "Updated bio",
      };

      const existingCompanion = {
        id: companionId,
        userId,
      };

      const updatedCompanion = {
        ...existingCompanion,
        ...updates,
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(existingCompanion as any);
      vi.mocked(db.humanCompanion.update).mockResolvedValue(updatedCompanion as any);

      const result = await updateCompanionProfile(companionId, userId, updates);

      expect(result.displayName).toBe(updates.displayName);
      expect(db.humanCompanion.update).toHaveBeenCalledWith({
        where: { id: companionId },
        data: expect.objectContaining(updates),
      });
    });

    it("should throw error if companion doesn't belong to user", async () => {
      const companionId = "companion-id";
      const userId = "wrong-user-id";

      const existingCompanion = {
        id: companionId,
        userId: "different-user-id",
      };

      vi.mocked(db.humanCompanion.findUnique).mockResolvedValue(existingCompanion as any);

      await expect(
        updateCompanionProfile(companionId, userId, { displayName: "Test" })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getActiveCompanions", () => {
    it("should return active companions", async () => {
      const mockCompanions = [
        {
          id: "companion-1",
          displayName: "Companion 1",
          isActive: true,
          isVerified: true,
        },
        {
          id: "companion-2",
          displayName: "Companion 2",
          isActive: true,
          isVerified: false,
        },
      ];

      vi.mocked(db.humanCompanion.findMany).mockResolvedValue(mockCompanions as any);

      const result = await getActiveCompanions();

      expect(result).toHaveLength(2);
      expect(db.humanCompanion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it("should filter by verified status", async () => {
      vi.mocked(db.humanCompanion.findMany).mockResolvedValue([]);

      await getActiveCompanions({ verified: true });

      expect(db.humanCompanion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            isVerified: true,
          }),
        })
      );
    });
  });
});

