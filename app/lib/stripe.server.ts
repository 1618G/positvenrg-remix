import Stripe from "stripe";
import { db } from "./db.server";
import type { SubscriptionPlan, SubscriptionStatus } from "./types.server";
import { Prisma } from "@prisma/client";
import logger from "./logger.server";
import { SUBSCRIPTION_CONFIG, APP_CONFIG } from "./config.server";
import { handleExternalServiceError, handleDatabaseError, NotFoundError, ValidationError, ExternalServiceError } from "./errors.server";
import { handleAppointmentPaymentWebhook } from "./appointment-payment.server";
import { validateOrThrow, userIdSchema, subscriptionPlanSchema } from "./validation.server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const BASE_URL = APP_CONFIG.baseUrl;

// Map subscription plan to Stripe price ID and interactions
export const PLAN_CONFIG: Record<string, { priceId: string; interactions: number | null; amount: number }> = {
  STARTER: {
    priceId: process.env.STRIPE_PRICE_ID_STARTER || "",
    interactions: SUBSCRIPTION_CONFIG.planInteractions.STARTER,
    amount: SUBSCRIPTION_CONFIG.planAmounts.STARTER,
  },
  PROFESSIONAL: {
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || "",
    interactions: SUBSCRIPTION_CONFIG.planInteractions.PROFESSIONAL,
    amount: SUBSCRIPTION_CONFIG.planAmounts.PROFESSIONAL,
  },
  PREMIUM: {
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM || "",
    interactions: SUBSCRIPTION_CONFIG.planInteractions.PREMIUM,
    amount: SUBSCRIPTION_CONFIG.planAmounts.PREMIUM,
  },
};

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  planType: "STARTER" | "PROFESSIONAL" | "PREMIUM"
): Promise<string> {
  validateOrThrow(userIdSchema, userId, "userId");
  validateOrThrow(subscriptionPlanSchema, planType, "planType");
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ExternalServiceError("STRIPE_SECRET_KEY not configured", "Stripe", undefined, { operation: "createCheckoutSession" });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User", userId);
  }

  const planConfig = PLAN_CONFIG[planType];
  if (!planConfig) {
    throw new ValidationError(`Invalid plan type: ${planType}`, "planType", { planType });
  }

  // Get or create Stripe customer
  let customerId = await getStripeCustomerId(userId);

  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: userId,
      },
    });
    customerId = customer.id;

    // Update user subscription with customer ID
    await db.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: `${BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/subscription/cancel`,
    metadata: {
      userId: userId,
      planType: planType,
    },
    subscription_data: {
      metadata: {
        userId: userId,
        planType: planType,
      },
    },
  });

  return session.url || "";
}

/**
 * Get Stripe customer ID for user
 */
async function getStripeCustomerId(userId: string): Promise<string | null> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  return subscription?.stripeCustomerId || null;
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      // Handle appointment payments
      await handleAppointmentPaymentWebhook(event);
      break;
    }

    default:
      logger.info({ eventType: event.type }, 'Unhandled Stripe event type');
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType as string;

  if (!userId || !planType) {
    logger.error({ sessionId: session.id }, 'Missing metadata in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const planConfig = PLAN_CONFIG[planType as keyof typeof PLAN_CONFIG];
  if (!planConfig) {
    logger.error({ planType }, 'Invalid plan type in checkout session');
    return; // Don't throw, just log and return
  }

  // Update user subscription
  await db.subscription.update({
    where: { userId },
    data: {
      planType: planType as SubscriptionPlan,
      status: "ACTIVE" as SubscriptionStatus,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id || null,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      interactionsAllowed: planConfig.interactions,
      interactionsUsed: 0,
      messagesUsed: 0, // Reset message count too
    },
  });
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.error({ subscriptionId: subscription.id }, 'Missing userId in subscription metadata');
    return;
  }

  const planType = subscription.metadata?.planType as string;
  const planConfig = PLAN_CONFIG[planType as keyof typeof PLAN_CONFIG];

  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      interactionsAllowed: planConfig?.interactions || null,
    },
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.error({ subscriptionId: subscription.id }, 'Missing userId in subscription metadata');
    return;
  }

  // Downgrade to FREE plan
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      planType: "FREE" as SubscriptionPlan,
      status: "CANCELED" as SubscriptionStatus,
      canceledAt: new Date(),
      stripeSubscriptionId: null,
      interactionsAllowed: null,
      interactionsUsed: 0,
    },
  });
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription) {
    // Reset interactions for new billing period
    await db.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        interactionsUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + SUBSCRIPTION_CONFIG.billingPeriodDays * 24 * 60 * 60 * 1000),
      },
    });
  }
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE" {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "canceled":
      return "CANCELED";
    case "past_due":
      return "PAST_DUE";
    case "trialing":
      return "TRIALING";
    case "incomplete":
      return "INCOMPLETE";
    default:
      return "ACTIVE";
  }
}

/**
 * Update subscription from Stripe (manual sync)
 */
export async function updateSubscriptionFromStripe(
  customerId: string,
  subscriptionId: string
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(subscription);
}

/**
 * Get Stripe invoices for a customer
 */
export async function getStripeInvoices(customerId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 100,
  });

  return invoices.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    created: new Date(invoice.created * 1000),
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : null,
    periodStart: invoice.period_start
      ? new Date(invoice.period_start * 1000)
      : null,
    periodEnd: invoice.period_end
      ? new Date(invoice.period_end * 1000)
      : null,
    invoicePdf: invoice.invoice_pdf,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    description: invoice.description || invoice.lines.data[0]?.description || "Subscription",
  }));
}

/**
 * Get Stripe subscription details
 */
export async function getStripeSubscription(subscriptionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel subscription (at period end or immediately)
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  if (cancelImmediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a new plan (upgrade/downgrade)
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanType: "STARTER" | "PROFESSIONAL" | "PREMIUM"
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const planConfig = PLAN_CONFIG[newPlanType];
  if (!planConfig) {
    throw new Error(`Invalid plan type: ${newPlanType}`);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPriceId = subscription.items.data[0]?.price.id;

  // Update subscription to new price
  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0]?.id,
        price: planConfig.priceId,
      },
    ],
    metadata: {
      ...subscription.metadata,
      planType: newPlanType,
    },
    proration_behavior: "always_invoice", // Charge prorated amount immediately
  });
}

/**
 * Get Stripe customer portal URL for self-service management
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

