import { json, type ActionFunctionArgs } from "@remix-run/node";
import { handleStripeWebhook } from "~/lib/stripe.server";
import Stripe from "stripe";
import logger from "~/lib/logger.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : 'Unknown error' }, 'Webhook signature verification failed');
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeWebhook(event);
    return json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', eventType: event?.type }, 'Error handling webhook');
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Disable body parsing for webhook routes in Remix
export const config = {
  runtime: "nodejs",
};

