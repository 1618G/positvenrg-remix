import { db } from "./db.server";
import { getCached, setCached, deleteCached, cacheKeys, cacheTTL } from "./cache.server";
import logger from "./logger.server";
import { z } from "zod";
import { ValidationError } from "./errors.server";

/**
 * Human companion management server functions
 */

const companionProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  avatar: z.string().optional(),
  tags: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string(),
  pricePerHour: z.number().min(100).max(1000000), // 100 pence to 10000 pence (£1 to £100)
  currency: z.string().default("GBP"),
  minimumDuration: z.number().min(15).max(480).default(30), // 15 minutes to 8 hours
});

const availabilityScheduleSchema = z.object({
  monday: z.array(z.string()).optional(),
  tuesday: z.array(z.string()).optional(),
  wednesday: z.array(z.string()).optional(),
  thursday: z.array(z.string()).optional(),
  friday: z.array(z.string()).optional(),
  saturday: z.array(z.string()).optional(),
  sunday: z.array(z.string()).optional(),
});

/**
 * Create a human companion profile
 */
export async function createCompanionProfile(
  userId: string,
  data: z.infer<typeof companionProfileSchema> & {
    availabilitySchedule?: z.infer<typeof availabilityScheduleSchema>;
  }
): Promise<{ id: string }> {
  // Validate input
  const validated = companionProfileSchema.parse(data);
  
  if (data.availabilitySchedule) {
    availabilityScheduleSchema.parse(data.availabilitySchedule);
  }

  // Check if user already has a companion profile
  const existing = await db.humanCompanion.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new ValidationError("User already has a companion profile");
  }

  // Create companion profile
  const companion = await db.humanCompanion.create({
    data: {
      userId,
      displayName: validated.displayName,
      bio: validated.bio,
      avatar: validated.avatar,
      tags: validated.tags || [],
      specialties: validated.specialties || [],
      languages: validated.languages || ["English"],
      timezone: validated.timezone,
      pricePerHour: validated.pricePerHour,
      currency: validated.currency,
      minimumDuration: validated.minimumDuration,
      availabilitySchedule: data.availabilitySchedule || {},
      isActive: true,
      isVerified: false, // Requires admin verification
    },
  });

  logger.info({ userId, companionId: companion.id }, "Companion profile created");

  return { id: companion.id };
}

/**
 * Get companion profile by ID
 */
export async function getCompanionProfile(companionId: string) {
  // Try cache first
  const cacheKey = cacheKeys.humanCompanion(companionId);
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          reviews: true,
        },
      },
    },
  });

  if (!companion) {
    return null;
  }

  // Cache for 2 hours
  await setCached(cacheKey, companion, cacheTTL.companion);

  return companion;
}

/**
 * Get companion profile by user ID
 */
export async function getCompanionProfileByUserId(userId: string) {
  const companion = await db.humanCompanion.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return companion;
}

/**
 * Update companion profile
 */
export async function updateCompanionProfile(
  companionId: string,
  userId: string,
  updates: Partial<z.infer<typeof companionProfileSchema> & {
    availabilitySchedule?: z.infer<typeof availabilityScheduleSchema>;
    isAvailable?: boolean;
  }>
) {
  // Verify ownership
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { userId: true },
  });

  if (!companion || companion.userId !== userId) {
    throw new ValidationError("Unauthorized - companion does not belong to user");
  }

  // Validate updates if provided
  if (updates.displayName || updates.bio || updates.pricePerHour) {
    const updateData: any = {};
    if (updates.displayName) updateData.displayName = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.timezone) updateData.timezone = updates.timezone;
    if (updates.pricePerHour) updateData.pricePerHour = updates.pricePerHour;
    if (updates.currency) updateData.currency = updates.currency;
    if (updates.minimumDuration) updateData.minimumDuration = updates.minimumDuration;

    companionProfileSchema.partial().parse(updateData);
  }

  if (updates.availabilitySchedule) {
    availabilityScheduleSchema.parse(updates.availabilitySchedule);
  }

  // Update companion
  const updated = await db.humanCompanion.update({
    where: { id: companionId },
    data: {
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.avatar !== undefined && { avatar: updates.avatar }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      ...(updates.specialties !== undefined && { specialties: updates.specialties }),
      ...(updates.languages !== undefined && { languages: updates.languages }),
      ...(updates.timezone && { timezone: updates.timezone }),
      ...(updates.pricePerHour && { pricePerHour: updates.pricePerHour }),
      ...(updates.currency && { currency: updates.currency }),
      ...(updates.minimumDuration && { minimumDuration: updates.minimumDuration }),
      ...(updates.availabilitySchedule && { availabilitySchedule: updates.availabilitySchedule }),
      ...(updates.isAvailable !== undefined && { isAvailable: updates.isAvailable }),
    },
  });

  // Invalidate cache
  await deleteCached(cacheKeys.humanCompanion(companionId));

  logger.info({ companionId, userId }, "Companion profile updated");

  return updated;
}

/**
 * Get list of active human companions
 */
export async function getActiveCompanions(filters?: {
  verified?: boolean;
  minRating?: number;
  tags?: string[];
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  const cacheKey = cacheKeys.companionList(JSON.stringify(filters));
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const where: any = {
    isActive: true,
  };

  if (filters?.verified !== undefined) {
    where.isVerified = filters.verified;
  }

  if (filters?.minRating) {
    where.rating = { gte: filters.minRating };
  }

  if (filters?.maxPrice) {
    where.pricePerHour = { lte: filters.maxPrice };
  }

  if (filters?.tags && filters.tags.length > 0) {
    where.tags = {
      array_contains: filters.tags,
    };
  }

  const companions = await db.humanCompanion.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          reviews: true,
        },
      },
    },
    orderBy: [
      { isVerified: "desc" },
      { rating: "desc" },
      { totalBookings: "desc" },
    ],
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
  });

  // Cache for 5 minutes
  await setCached(cacheKey, companions, 300);

  return companions;
}

/**
 * Calculate companion rating from reviews
 */
export async function updateCompanionRating(companionId: string): Promise<void> {
  const reviews = await db.companionReview.findMany({
    where: {
      companionId,
      isPublic: true,
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) {
    await db.humanCompanion.update({
      where: { id: companionId },
      data: { rating: null },
    });
    return;
  }

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await db.humanCompanion.update({
    where: { id: companionId },
    data: { rating: averageRating },
  });

  // Invalidate cache
  await deleteCached(cacheKeys.humanCompanion(companionId));
}

/**
 * Verify companion (admin only)
 */
export async function verifyCompanion(companionId: string, adminUserId: string): Promise<void> {
  // Check admin permissions (would need to verify user is admin)
  const admin = await db.user.findUnique({
    where: { id: adminUserId },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new ValidationError("Unauthorized - admin access required");
  }

  await db.humanCompanion.update({
    where: { id: companionId },
    data: { isVerified: true },
  });

  // Invalidate cache
  await deleteCached(cacheKeys.humanCompanion(companionId));

  logger.info({ companionId, adminUserId }, "Companion verified by admin");
}

/**
 * Deactivate companion
 */
export async function deactivateCompanion(companionId: string, userId: string): Promise<void> {
  // Verify ownership
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { userId: true },
  });

  if (!companion || companion.userId !== userId) {
    throw new ValidationError("Unauthorized - companion does not belong to user");
  }

  await db.humanCompanion.update({
    where: { id: companionId },
    data: { isActive: false },
  });

  // Invalidate cache
  await deleteCached(cacheKeys.humanCompanion(companionId));

  logger.info({ companionId, userId }, "Companion deactivated");
}

