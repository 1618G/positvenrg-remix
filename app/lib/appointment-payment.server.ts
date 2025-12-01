import Stripe from "stripe";
import { db } from "./db.server";
import { getAppointment, calculateEarnings } from "./appointment.server";
import { processAppointmentEarning } from "./earnings.server";
import logger from "./logger.server";
import { requireEnv } from "./env.server";
import { ValidationError, ExternalServiceError } from "./errors.server";
import type { Appointment } from "@prisma/client";

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2025-10-29.clover",
});

/**
 * Create Stripe Payment Intent for appointment booking
 */
export async function createAppointmentPaymentIntent(
  appointmentId: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  // Get appointment directly from database to ensure proper typing
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: { email: true, name: true },
      },
      companion: {
        select: { displayName: true },
      },
    },
  });

  if (!appointment) {
    throw new ValidationError("Appointment not found");
  }

  if (appointment.paymentStatus !== "PENDING") {
    throw new ValidationError("Appointment payment already processed");
  }

  if (appointment.stripePaymentId) {
    // Payment intent already exists, retrieve it
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(appointment.stripePaymentId);
      return {
        clientSecret: paymentIntent.client_secret || "",
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error", appointmentId },
        "Failed to retrieve existing payment intent"
      );
      // Continue to create new one
    }
  }

  const user = appointment.user;

  if (!user) {
    throw new ValidationError("User not found");
  }

  // Get or create Stripe customer
  let customerId: string | undefined;
  const subscription = await db.subscription.findUnique({
    where: { userId: appointment.userId },
    select: { stripeCustomerId: true },
  });

  if (subscription?.stripeCustomerId) {
    customerId = subscription.stripeCustomerId;
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: appointment.userId,
      },
    });
    customerId = customer.id;

    // Update subscription with customer ID
    await db.subscription.update({
      where: { userId: appointment.userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(appointment.amount), // Amount in pence
    currency: appointment.currency.toLowerCase(),
    customer: customerId,
    metadata: {
      appointmentId: appointment.id,
      userId: appointment.userId,
      companionId: appointment.companionId,
      type: "appointment",
    },
    description: `Appointment with ${appointment.companion?.displayName || "companion"}`,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Update appointment with payment intent ID
  await db.appointment.update({
    where: { id: appointmentId },
    data: { stripePaymentId: paymentIntent.id },
  });

  logger.info({ appointmentId, paymentIntentId: paymentIntent.id }, "Payment intent created for appointment");

  return {
    clientSecret: paymentIntent.client_secret || "",
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Confirm appointment payment and update status
 */
export async function confirmAppointmentPayment(
  paymentIntentId: string
): Promise<{ appointmentId: string }> {
  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new ValidationError(`Payment not succeeded. Status: ${paymentIntent.status}`);
  }

  // Find appointment
  const appointment = await db.appointment.findUnique({
    where: { stripePaymentId: paymentIntentId },
    include: {
      companion: true,
    },
  });

  if (!appointment) {
    throw new ValidationError("Appointment not found for payment intent");
  }

  // Update appointment status
  await db.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
  });

  // Process earnings for companion
  await processAppointmentEarning(appointment.id);

  logger.info({ appointmentId: appointment.id, paymentIntentId }, "Appointment payment confirmed");

  return { appointmentId: appointment.id };
}

/**
 * Process refund for cancelled appointment
 */
export async function refundAppointmentPayment(
  appointmentId: string,
  refundAmount?: number
): Promise<{ refundId: string }> {
  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    throw new ValidationError("Appointment not found");
  }

  if (!appointment || !("stripePaymentId" in appointment) || !appointment.stripePaymentId) {
    throw new ValidationError("No payment found for appointment");
  }

  if (!("paymentStatus" in appointment) || appointment.paymentStatus !== "PAID") {
    throw new ValidationError("Appointment payment not paid, cannot refund");
  }

  const amountToRefund = refundAmount || ("refundAmount" in appointment ? appointment.refundAmount : null) || ("amount" in appointment ? appointment.amount : 0);

  // Create refund
  const refund = await stripe.refunds.create({
    payment_intent: appointment.stripePaymentId,
    amount: Math.round(amountToRefund),
    metadata: {
      appointmentId: appointment.id,
      reason: appointment.cancellationReason || "Cancelled",
    },
  });

  // Update appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentStatus: "REFUNDED",
      refundAmount: amountToRefund,
    },
  });

  logger.info({ appointmentId, refundId: refund.id, amount: amountToRefund }, "Appointment payment refunded");

  return { refundId: refund.id };
}

/**
 * Handle Stripe webhook for appointment payments
 */
export async function handleAppointmentPaymentWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.type === "appointment" && paymentIntent.metadata?.appointmentId) {
        await confirmAppointmentPayment(paymentIntent.id);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      if (failedPayment.metadata?.type === "appointment" && failedPayment.metadata?.appointmentId) {
        await db.appointment.update({
          where: { stripePaymentId: failedPayment.id },
          data: { paymentStatus: "FAILED" },
        });
        logger.warn({ paymentIntentId: failedPayment.id }, "Appointment payment failed");
      }
      break;

    default:
      // Other event types not relevant to appointments
      break;
  }
}

