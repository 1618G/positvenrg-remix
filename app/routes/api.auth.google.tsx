import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { getAuthUrl } from "~/lib/google-calendar.server";
import { db } from "~/lib/db.server";
import logger from "~/lib/logger.server";
import crypto from "crypto";

/**
 * Initiate Google OAuth flow for calendar integration
 * Requires: ?companionId=xxx query parameter
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Verify user is authenticated
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/api/auth/google");
  }

  const { verifyUserSession, getUserById } = await import("~/lib/auth.server");
  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/api/auth/google");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  // Get companion ID from query params
  const url = new URL(request.url);
  const companionId = url.searchParams.get("companionId");

  if (!companionId) {
    return redirect("/companion/dashboard?error=missing_companion_id");
  }

  // Verify companion belongs to user
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { userId: true },
  });

  if (!companion || companion.userId !== user.id) {
    logger.warn({ userId: user.id, companionId }, "Unauthorized Google OAuth attempt");
    return redirect("/companion/dashboard?error=unauthorized");
  }

  // Generate state token (store companionId in state for callback)
  const state = `${companionId}:${crypto.randomBytes(16).toString("hex")}`;

  // Store state in session/cookie for verification
  const authUrl = getAuthUrl(state);

  logger.info({ userId: user.id, companionId }, "Initiating Google Calendar OAuth");

  return redirect(authUrl);
}

