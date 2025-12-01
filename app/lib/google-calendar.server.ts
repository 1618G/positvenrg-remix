import { google } from "googleapis";
import { db } from "./db.server";
import { getEnv, requireEnv } from "./env.server";
import logger from "./logger.server";
import crypto from "crypto";

/**
 * Google Calendar API integration
 * Handles OAuth, calendar sync, and event management
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypt sensitive data (OAuth tokens)
 */
function encrypt(text: string): string {
  const encryptionKey = requireEnv("ENCRYPTION_KEY");
  const key = crypto.scryptSync(encryptionKey, "salt", KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data (OAuth tokens)
 */
function decrypt(encryptedData: string): string {
  const encryptionKey = requireEnv("ENCRYPTION_KEY");
  const key = crypto.scryptSync(encryptionKey, "salt", KEY_LENGTH);
  const [ivHex, tagHex, encrypted] = encryptedData.split(":");

  if (!ivHex || !tagHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Get OAuth2 client for Google Calendar
 */
function getOAuth2Client() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI", `${getEnv("BASE_URL", "http://localhost:8780")}/api/auth/google/callback`);

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get Google Calendar API client for a companion
 */
export async function getCalendarClient(companionId: string) {
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!companion?.googleAccessToken || !companion.googleRefreshToken) {
    throw new Error("Google Calendar not connected for this companion");
  }

  const oauth2Client = getOAuth2Client();

  // Decrypt tokens
  const accessToken = decrypt(companion.googleAccessToken);
  const refreshToken = decrypt(companion.googleRefreshToken);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: companion.googleTokenExpiry?.getTime(),
  });

  // Refresh token if expired
  if (companion.googleTokenExpiry && companion.googleTokenExpiry < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      await db.humanCompanion.update({
        where: { id: companionId },
        data: {
          googleAccessToken: encrypt(credentials.access_token || ""),
          googleRefreshToken: encrypt(credentials.refresh_token || refreshToken),
          googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error", companionId },
        "Failed to refresh Google Calendar token"
      );
      throw new Error("Failed to refresh Google Calendar token");
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent to get refresh token
    state: state || crypto.randomBytes(16).toString("hex"),
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("No access token received");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || "",
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

/**
 * Save OAuth tokens to companion profile
 */
export async function saveCalendarTokens(
  companionId: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: Date | null
): Promise<void> {
  await db.humanCompanion.update({
    where: { id: companionId },
    data: {
      googleAccessToken: encrypt(accessToken),
      googleRefreshToken: encrypt(refreshToken),
      googleTokenExpiry: expiryDate,
      calendarSyncEnabled: true,
    },
  });
}

/**
 * Get calendar events for a date range
 */
export async function getCalendarEvents(
  companionId: string,
  timeMin: Date,
  timeMax: Date
): Promise<Array<{
  id: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}>> {
  const calendar = await getCalendarClient(companionId);
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { googleCalendarId: true },
  });

  const calendarId = companion?.googleCalendarId || "primary";

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  return events
    .filter((event) => event.start && event.end)
    .map((event) => ({
      id: event.id || "",
      summary: event.summary || "No title",
      start: new Date(event.start!.dateTime || event.start!.date!),
      end: new Date(event.end!.dateTime || event.end!.date!),
      description: event.description || undefined,
    }));
}

/**
 * Create calendar event for appointment
 */
export async function createCalendarEvent(
  companionId: string,
  appointment: {
    id: string;
    startTime: Date;
    endTime: Date;
    userEmail: string;
    userName: string;
    notes?: string;
    meetingLink?: string;
  }
): Promise<string> {
  const calendar = await getCalendarClient(companionId);
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { googleCalendarId: true, displayName: true },
  });

  const calendarId = companion?.googleCalendarId || "primary";

  const event = {
    summary: `Appointment with ${appointment.userName}`,
    description: appointment.notes || `Appointment booked through PositiveNRG${appointment.meetingLink ? `\n\nMeeting Link: ${appointment.meetingLink}` : ""}`,
    start: {
      dateTime: appointment.startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: appointment.endTime.toISOString(),
      timeZone: "UTC",
    },
    attendees: [
      { email: appointment.userEmail },
    ],
    conferenceData: appointment.meetingLink
      ? undefined
      : {
          createRequest: {
            requestId: appointment.id,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
    conferenceDataVersion: appointment.meetingLink ? 0 : 1,
  });

  return response.data.id || "";
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  companionId: string,
  eventId: string,
  updates: {
    startTime?: Date;
    endTime?: Date;
    summary?: string;
    description?: string;
  }
): Promise<void> {
  const calendar = await getCalendarClient(companionId);
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { googleCalendarId: true },
  });

  const calendarId = companion?.googleCalendarId || "primary";

  // Get existing event
  const existingEvent = await calendar.events.get({
    calendarId,
    eventId,
  });

  if (!existingEvent.data) {
    throw new Error("Event not found");
  }

  // Update event
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      ...existingEvent.data,
      summary: updates.summary || existingEvent.data.summary,
      description: updates.description || existingEvent.data.description,
      start: updates.startTime
        ? {
            dateTime: updates.startTime.toISOString(),
            timeZone: "UTC",
          }
        : existingEvent.data.start,
      end: updates.endTime
        ? {
            dateTime: updates.endTime.toISOString(),
            timeZone: "UTC",
          }
        : existingEvent.data.end,
    },
  });
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(companionId: string, eventId: string): Promise<void> {
  const calendar = await getCalendarClient(companionId);
  const companion = await db.humanCompanion.findUnique({
    where: { id: companionId },
    select: { googleCalendarId: true },
  });

  const calendarId = companion?.googleCalendarId || "primary";

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * Sync availability from Google Calendar
 * Marks time slots as busy if they have events
 */
export async function syncAvailabilityFromCalendar(
  companionId: string,
  date: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await getCalendarEvents(companionId, startOfDay, endOfDay);

  return events.map((event) => ({
    start: event.start,
    end: event.end,
  }));
}

