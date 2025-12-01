/**
 * Security audit utilities
 * Provides security checks and compliance validation
 */

import { db } from "./db.server";
import logger from "./logger.server";

/**
 * Run security audit checks
 */
export async function runSecurityAudit(): Promise<{
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const checks: Array<{ name: string; passed: boolean; message: string }> = [];

  // Check 1: Environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "STRIPE_SECRET_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key] || process.env[key] === ""
  );

  checks.push({
    name: "Environment Variables",
    passed: missingEnvVars.length === 0,
    message:
      missingEnvVars.length === 0
        ? "All required environment variables are set"
        : `Missing environment variables: ${missingEnvVars.join(", ")}`,
  });

  // Check 2: JWT Secret strength
  const jwtSecret = process.env.JWT_SECRET || "";
  const jwtSecretStrong = jwtSecret.length >= 32 && /[A-Za-z0-9!@#$%^&*]/.test(jwtSecret);

  checks.push({
    name: "JWT Secret Strength",
    passed: jwtSecretStrong,
    message: jwtSecretStrong
      ? "JWT secret meets strength requirements"
      : "JWT secret should be at least 32 characters with mixed characters",
  });

  // Check 3: Database connection
  let dbConnected = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    logger.error({ error }, "Database connection check failed");
  }

  checks.push({
    name: "Database Connection",
    passed: dbConnected,
    message: dbConnected
      ? "Database connection is active"
      : "Database connection failed",
  });

  // Check 4: HTTPS in production
  const isProduction = process.env.NODE_ENV === "production";
  const hasHttps = process.env.BASE_URL?.startsWith("https://") || !isProduction;

  checks.push({
    name: "HTTPS Configuration",
    passed: hasHttps,
    message: hasHttps
      ? "HTTPS is configured for production"
      : "HTTPS should be enabled in production",
  });

  // Check 5: Rate limiting enabled
  const hasRedis = !!process.env.REDIS_URL;

  checks.push({
    name: "Rate Limiting",
    passed: hasRedis || !isProduction,
    message: hasRedis
      ? "Redis configured for rate limiting"
      : "Redis recommended for production rate limiting",
  });

  const passed = checks.every((check) => check.passed);

  return { passed, checks };
}

/**
 * Check for security vulnerabilities in user input
 */
export function checkInputSecurity(input: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|'|"|`)/,
  ];

  if (sqlPatterns.some((pattern) => pattern.test(input))) {
    warnings.push("Potential SQL injection pattern detected");
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
  ];

  if (xssPatterns.some((pattern) => pattern.test(input))) {
    warnings.push("Potential XSS pattern detected");
  }

  // Check for command injection
  const commandPatterns = [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|rm|mv|cp|chmod|sudo|su)\b/i,
  ];

  if (commandPatterns.some((pattern) => pattern.test(input))) {
    warnings.push("Potential command injection pattern detected");
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}


