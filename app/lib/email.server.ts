import nodemailer from "nodemailer";
import { db } from "./db.server";
import crypto from "crypto";

// Gmail SMTP configuration
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const transporter = createTransporter();

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.GMAIL_USER || "noreply@positivenrg.com";
const BASE_URL = process.env.BASE_URL || "http://localhost:8780";

/**
 * Generate a secure random token for email verification or magic links
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a 6-digit verification code for dummy verification
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
  token: string
): Promise<void> {
  if (!transporter || !process.env.GMAIL_USER) {
    console.warn("Gmail not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing), skipping email send");
    return;
  }

  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"PositiveNRG" <${FROM_EMAIL}>`,
      to: email,
      subject: "Verify your PositiveNRG account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FFE5B4 0%, #FFCC80 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px;">Welcome to PositiveNRG! 🌟</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up! Please verify your email address to activate your account.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #FFE5B4 0%, #FFCC80 100%); color: #2C3E50; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #FFB84D; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <p style="font-size: 14px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PositiveNRG. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

/**
 * Send magic link for passwordless login
 */
export async function sendMagicLink(
  email: string,
  token: string
): Promise<void> {
  if (!transporter || !process.env.GMAIL_USER) {
    console.warn("Gmail not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing), skipping email send");
    return;
  }

  const magicLinkUrl = `${BASE_URL}/auth/magic-link/${token}`;

  try {
    await transporter.sendMail({
      from: `"PositiveNRG" <${FROM_EMAIL}>`,
      to: email,
      subject: "Your PositiveNRG login link",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FFE5B4 0%, #FFCC80 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
              <h1 style="margin: 0; color: #2C3E50; font-size: 28px;">Your Login Link 🔐</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Click the button below to securely log in to your PositiveNRG account. No password needed!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLinkUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #FFE5B4 0%, #FFCC80 100%); color: #2C3E50; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Login to PositiveNRG
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <a href="${magicLinkUrl}" style="color: #FFB84D; word-break: break-all;">${magicLinkUrl}</a>
              </p>
              
              <p style="font-size: 14px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                This link will expire in 15 minutes and can only be used once. If you didn't request this link, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PositiveNRG. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`✅ Magic link sent to ${email}`);
  } catch (error) {
    console.error("Failed to send magic link:", error);
    throw error;
  }
}

/**
 * Verify email token and activate account
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const user = await db.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    return { success: false, error: "Invalid verification token" };
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return { success: false, error: "Verification token has expired" };
  }

  // Verify email and clear token
  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return { success: true, userId: user.id };
}

/**
 * Verify magic link token and return user
 */
export async function verifyMagicLinkToken(token: string): Promise<{
  success: boolean;
  user?: { id: string; email: string };
  error?: string;
}> {
  const user = await db.user.findUnique({
    where: { magicLinkToken: token },
  });

  if (!user) {
    return { success: false, error: "Invalid magic link token" };
  }

  if (user.magicLinkTokenExpiry && user.magicLinkTokenExpiry < new Date()) {
    return { success: false, error: "Magic link has expired" };
  }

  // Clear magic link token after use
  await db.user.update({
    where: { id: user.id },
    data: {
      magicLinkToken: null,
      magicLinkTokenExpiry: null,
    },
  });

  return { success: true, user: { id: user.id, email: user.email } };
}

/**
 * Create and store verification token for user
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateSecureToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

  await db.user.update({
    where: { id: userId },
    data: {
      verificationToken: token,
      verificationTokenExpiry: expiry,
    },
  });

  return token;
}

/**
 * Create and store magic link token for user
 */
export async function createMagicLinkToken(userId: string): Promise<string> {
  const token = generateSecureToken();
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15); // 15 minute expiry

  await db.user.update({
    where: { id: userId },
    data: {
      magicLinkToken: token,
      magicLinkTokenExpiry: expiry,
    },
  });

  return token;
}
