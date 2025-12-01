import { db } from "./db.server";
import { getCached, setCached, deleteCached, cacheKeys, cacheTTL } from "./cache.server";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, syncAvailabilityFromCalendar } from "./google-calendar.server";
import logger from "./logger.server";
import { ValidationError } from "./errors.server";

/**
 * Appointment management server functions
 */

const PLATFORM_FEE_PERCENTAGE = 0.20; // 20% platform fee

/**
 * Check if a time slot is available for booking
 */
export async function checkAvailability(
  companionId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; reason?: string }> {
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: {
      isActive: true,
      isAvailable: true,
      availabilitySchedule: true,
      timezone: true,
      calendarSyncEnabled: true,
    },
  });

  if (!companion) {
    return { available: false, reason: "Companion not found" };
  }

  if (!companion.isActive) {
    return { available: false, reason: "Companion is not active" };
  }

  if (!companion.isAvailable) {
    return { available: false, reason: "Companion is currently unavailable" };
  }

  // Check for conflicting appointments
  const conflicting = await db.appointment.findFirst({
    where: {
      companionId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });

  if (conflicting) {
    return { available: false, reason: "Time slot already booked" };
  }

  // If calendar sync is enabled, check Google Calendar
  if (companion.calendarSyncEnabled) {
    try {
      const busySlots = await syncAvailabilityFromCalendar(companionId, startTime);
      const hasConflict = busySlots.some(
        (slot) =>
          (slot.start <= startTime && slot.end > startTime) ||
          (slot.start < endTime && slot.end >= endTime) ||
          (slot.start >= startTime && slot.end <= endTime)
      );

      if (hasConflict) {
        return { available: false, reason: "Time slot is busy in calendar" };
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error", companionId },
        "Error checking calendar availability"
      );
      // Continue with booking if calendar check fails
    }
  }

  return { available: true };
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: {
  userId: string;
  companionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  timezone: string;
  meetingType: "VIDEO_CALL" | "PHONE_CALL" | "TEXT_CHAT" | "IN_PERSON";
  notes?: string;
  amount: number;
  currency?: string;
}): Promise<{ id: string }> {
  // Verify companion exists and is active
  const companion = await db.humanCompanion.findUnique({
    where: { id: data.companionId },
    select: {
      isActive: true,
      pricePerHour: true,
      minimumDuration: true,
      calendarSyncEnabled: true,
    },
  });

  if (!companion || !companion.isActive) {
    throw new ValidationError("Companion not available for booking");
  }

  // Check availability
  const availability = await checkAvailability(data.companionId, data.startTime, data.endTime);
  if (!availability.available) {
    throw new ValidationError(availability.reason || "Time slot not available");
  }

  // Verify duration meets minimum
  if (data.duration < companion.minimumDuration) {
    throw new ValidationError(`Minimum booking duration is ${companion.minimumDuration} minutes`);
  }

  // Create appointment
  const appointment = await db.appointment.create({
    data: {
      userId: data.userId,
      companionId: data.companionId,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      timezone: data.timezone,
      meetingType: data.meetingType,
      notes: data.notes,
      amount: data.amount,
      currency: data.currency || "GBP",
      status: "PENDING",
      paymentStatus: "PENDING",
    },
  });

  // Create calendar event if sync is enabled
  if (companion.calendarSyncEnabled) {
    try {
      const user = await db.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true },
      });

      if (user) {
        const googleEventId = await createCalendarEvent(data.companionId, {
          id: appointment.id,
          startTime: data.startTime,
          endTime: data.endTime,
          userEmail: user.email,
          userName: user.name || user.email,
          notes: data.notes,
        });

        await db.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId },
        });
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error", appointmentId: appointment.id },
        "Failed to create calendar event"
      );
      // Continue even if calendar event creation fails
    }
  }

  logger.info({ appointmentId: appointment.id, userId: data.userId, companionId: data.companionId }, "Appointment created");

  return { id: appointment.id };
}

/**
 * Get appointment by ID
 */
export async function getAppointment(appointmentId: string) {
  // Try cache first
  const cacheKey = cacheKeys.appointment(appointmentId);
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      companion: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
        },
      },
      review: true,
    },
  });

  if (appointment) {
    await setCached(cacheKey, appointment, cacheTTL.appointment);
  }

  return appointment;
}

/**
 * Get user's appointments
 */
export async function getUserAppointments(
  userId: string,
  filters?: {
    status?: string[];
    upcoming?: boolean;
    limit?: number;
  }
) {
  const where: any = { userId };

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters?.upcoming) {
    where.startTime = { gte: new Date() };
  }

  const appointments = await db.appointment.findMany({
    where,
    include: {
      companion: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
        },
      },
    },
    orderBy: { startTime: filters?.upcoming ? "asc" : "desc" },
    take: filters?.limit || 50,
  });

  return appointments;
}

/**
 * Get companion's appointments
 */
export async function getCompanionAppointments(
  companionId: string,
  filters?: {
    status?: string[];
    upcoming?: boolean;
    limit?: number;
  }
) {
  const where: any = { companionId };

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters?.upcoming) {
    where.startTime = { gte: new Date() };
  }

  const appointments = await db.appointment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startTime: filters?.upcoming ? "asc" : "desc" },
    take: filters?.limit || 50,
  });

  return appointments;
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: "user" | "companion",
  userId: string,
  reason?: string
): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      companion: {
        select: { userId: true },
      },
    },
  });

  if (!appointment) {
    throw new ValidationError("Appointment not found");
  }

  // Verify authorization
  if (cancelledBy === "user" && appointment.userId !== userId) {
    throw new ValidationError("Unauthorized");
  }
  if (cancelledBy === "companion" && appointment.companion.userId !== userId) {
    throw new ValidationError("Unauthorized");
  }

  // Calculate refund (full refund if 24+ hours notice, 50% if less)
  const hoursUntilStart = (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const refundPercentage = hoursUntilStart >= 24 ? 1.0 : 0.5;
  const refundAmount = Math.round(appointment.amount * refundPercentage);

  // Update appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason,
      refundAmount,
    },
  });

  // Delete calendar event if exists
  if (appointment.googleEventId) {
    try {
      await deleteCalendarEvent(appointment.companionId, appointment.googleEventId);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error", appointmentId },
        "Failed to delete calendar event"
      );
    }
  }

  // Invalidate cache
  await deleteCached(cacheKeys.appointment(appointmentId));

  logger.info({ appointmentId, cancelledBy, userId }, "Appointment cancelled");
}

/**
 * Complete appointment
 */
export async function completeAppointment(appointmentId: string, companionId: string): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { companionId: true, status: true },
  });

  if (!appointment || appointment.companionId !== companionId) {
    throw new ValidationError("Appointment not found or unauthorized");
  }

  if (appointment.status !== "CONFIRMED") {
    throw new ValidationError("Only confirmed appointments can be completed");
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Update companion stats
  await db.humanCompanion.update({
    where: { id: companionId },
    data: {
      totalBookings: { increment: 1 },
    },
  });

  // Invalidate cache
  await deleteCached(cacheKeys.appointment(appointmentId));

  logger.info({ appointmentId, companionId }, "Appointment completed");
}

/**
 * Calculate appointment amount based on duration and price per hour
 */
export function calculateAppointmentAmount(
  durationMinutes: number,
  pricePerHour: number
): number {
  const hours = durationMinutes / 60;
  return Math.round(hours * pricePerHour);
}

/**
 * Calculate platform fee and net earnings
 */
export function calculateEarnings(amount: number): {
  platformFee: number;
  netAmount: number;
} {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE);
  const netAmount = amount - platformFee;
  return { platformFee, netAmount };
}

