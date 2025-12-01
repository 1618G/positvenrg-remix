import { json, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db.server";
import { syncAvailabilityFromCalendar } from "~/lib/google-calendar.server";
import logger from "~/lib/logger.server";

/**
 * Webhook handler for Google Calendar push notifications
 * Handles calendar event changes and syncs availability
 * 
 * Note: This requires setting up Google Calendar push notifications
 * See: https://developers.google.com/calendar/api/guides/push
 */
export async function action({ request }: ActionFunctionArgs) {
  // Verify webhook signature (if configured)
  const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get("X-Goog-Channel-Token");
    if (signature !== webhookSecret) {
      logger.warn({}, "Invalid Google Calendar webhook signature");
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const channelId = body.channel?.id;
    const resourceState = body.resourceState;

    // Handle different notification types
    if (resourceState === "sync" || resourceState === "exists") {
      // Find companion by channel ID (stored when setting up webhook)
      const companion = await db.humanCompanion.findFirst({
        where: {
          // Store channelId in metadata or separate field
          // For now, we'll need to track this differently
        },
      });

      if (companion) {
        // Sync availability for today and next 7 days
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          await syncAvailabilityFromCalendar(companion.id, date);
        }

        logger.info({ companionId: companion.id }, "Calendar availability synced via webhook");
      }
    }

    // Return 200 to acknowledge receipt
    return json({ success: true });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Google Calendar webhook error"
    );
    // Still return 200 to prevent retries for invalid requests
    return json({ error: "Processing failed" }, { status: 200 });
  }
}

/**
 * Handle GET requests for webhook verification
 * Google Calendar sends GET requests to verify the endpoint
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("challenge");

  if (challenge) {
    // Return challenge for webhook verification
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return json({ message: "Google Calendar webhook endpoint" });
}

