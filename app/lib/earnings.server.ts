import { db } from "./db.server";
import { getAppointment, calculateEarnings } from "./appointment.server";
import logger from "./logger.server";
import { ValidationError } from "./errors.server";

/**
 * Earnings management for human companions
 */

/**
 * Process earnings for a completed appointment
 */
export async function processAppointmentEarning(appointmentId: string): Promise<void> {
  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    throw new ValidationError("Appointment not found");
  }

  if (appointment.paymentStatus !== "PAID") {
    throw new ValidationError("Appointment payment not confirmed");
  }

  // Check if earning already exists
  const existing = await db.companionEarning.findUnique({
    where: { appointmentId },
  });

  if (existing) {
    return; // Already processed
  }

  // Calculate earnings
  const { platformFee, netAmount } = calculateEarnings(appointment.amount);

  // Create earning record
  await db.companionEarning.create({
    data: {
      companionId: appointment.companionId,
      appointmentId: appointment.id,
      amount: appointment.amount,
      currency: appointment.currency,
      platformFee,
      netAmount,
      status: "PENDING", // Will be processed via Stripe Connect
    },
  });

  // Update companion total earnings
  await db.humanCompanion.update({
    where: { id: appointment.companionId },
    data: {
      totalEarnings: { increment: netAmount },
    },
  });

  logger.info(
    { appointmentId, companionId: appointment.companionId, netAmount, platformFee },
    "Earnings processed for appointment"
  );
}

/**
 * Get companion earnings
 */
export async function getCompanionEarnings(
  companionId: string,
  filters?: {
    status?: string[];
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { companionId };

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  const earnings = await db.companionEarning.findMany({
    where,
    include: {
      appointment: {
        select: {
          id: true,
          startTime: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });

  // Get totals
  const totals = await db.companionEarning.aggregate({
    where: { companionId },
    _sum: {
      netAmount: true,
      platformFee: true,
      amount: true,
    },
  });

  return {
    earnings,
    totals: {
      totalEarnings: totals._sum.netAmount || 0,
      totalPlatformFees: totals._sum.platformFee || 0,
      totalRevenue: totals._sum.amount || 0,
    },
  };
}

/**
 * Get earnings summary for companion
 */
export async function getEarningsSummary(companionId: string) {
  const [pending, processing, completed] = await Promise.all([
    db.companionEarning.aggregate({
      where: { companionId, status: "PENDING" },
      _sum: { netAmount: true },
    }),
    db.companionEarning.aggregate({
      where: { companionId, status: "PROCESSING" },
      _sum: { netAmount: true },
    }),
    db.companionEarning.aggregate({
      where: { companionId, status: "COMPLETED" },
      _sum: { netAmount: true },
    }),
  ]);

  return {
    pending: pending._sum.netAmount || 0,
    processing: processing._sum.netAmount || 0,
    completed: completed._sum.netAmount || 0,
    total: (pending._sum.netAmount || 0) + (processing._sum.netAmount || 0) + (completed._sum.netAmount || 0),
  };
}

