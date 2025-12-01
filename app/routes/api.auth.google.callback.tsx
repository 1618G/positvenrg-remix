import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { exchangeCodeForTokens, saveCalendarTokens } from "~/lib/google-calendar.server";
import { db } from "~/lib/db.server";
import logger from "~/lib/logger.server";
import crypto from "crypto";

/**
 * Handle Google OAuth callback
 * Exchanges authorization code for tokens and saves to companion profile
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    logger.error({ error }, "Google OAuth error");
    return redirect("/companion/dashboard?error=oauth_failed");
  }

  if (!code || !state) {
    return redirect("/companion/dashboard?error=missing_params");
  }

  // Verify user is authenticated
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/api/auth/google/callback");
  }

  const { verifyUserSession, getUserById } = await import("~/lib/auth.server");
  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  // Extract companionId from state
  const [companionId] = state.split(":");

  if (!companionId) {
    return redirect("/companion/dashboard?error=invalid_state");
  }

  // Verify companion belongs to user
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { userId: true },
  });

  if (!companion || companion.userId !== user.id) {
    logger.warn({ userId: user.id, companionId }, "Unauthorized Google OAuth callback");
    return redirect("/companion/dashboard?error=unauthorized");
  }

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiryDate } = await exchangeCodeForTokens(code);

    // Save tokens to companion profile
    await saveCalendarTokens(companionId, accessToken, refreshToken, expiryDate);

    logger.info({ userId: user.id, companionId }, "Google Calendar connected successfully");

    return redirect("/companion/dashboard?success=calendar_connected");
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id, companionId },
      "Failed to connect Google Calendar"
    );
    return redirect("/companion/dashboard?error=connection_failed");
  }
}

