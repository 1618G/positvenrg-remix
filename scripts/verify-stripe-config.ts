#!/usr/bin/env tsx
/**
 * Verify Stripe configuration
 * Checks that all required Stripe environment variables are set
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env file manually
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Don't override existing env vars
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const requiredVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_STARTER",
  "STRIPE_PRICE_ID_PROFESSIONAL",
  "STRIPE_PRICE_ID_PREMIUM",
  "BASE_URL",
];

const optionalVars = [];

console.log("🔍 Verifying Stripe Configuration...\n");

let allValid = true;
const missing: string[] = [];
const invalid: string[] = [];

// Check required variables
for (const varName of requiredVars) {
  const value = process.env[varName];
  
  if (!value || value.trim() === "") {
    missing.push(varName);
    allValid = false;
    continue;
  }

  // Validate format
  let isValid = true;
  if (varName === "STRIPE_SECRET_KEY") {
    isValid = value.startsWith("sk_test_") || value.startsWith("sk_live_");
  } else if (varName === "STRIPE_PUBLISHABLE_KEY") {
    isValid = value.startsWith("pk_test_") || value.startsWith("pk_live_");
  } else if (varName === "STRIPE_WEBHOOK_SECRET") {
    isValid = value.startsWith("whsec_");
  } else if (varName.startsWith("STRIPE_PRICE_ID_")) {
    isValid = value.startsWith("price_");
  } else if (varName === "BASE_URL") {
    isValid = value.startsWith("http://") || value.startsWith("https://");
  }

  if (!isValid) {
    invalid.push(varName);
    allValid = false;
  }
}

// Report results
console.log("✅ Valid Variables:");
for (const varName of requiredVars) {
  if (!missing.includes(varName) && !invalid.includes(varName)) {
    const value = process.env[varName];
    const masked = varName.includes("SECRET") || varName.includes("KEY")
      ? `${value?.substring(0, 12)}...`
      : value;
    console.log(`   ${varName}: ${masked}`);
  }
}

if (missing.length > 0) {
  console.log("\n❌ Missing Variables:");
  missing.forEach(v => console.log(`   - ${v}`));
}

if (invalid.length > 0) {
  console.log("\n⚠️  Invalid Variables:");
  invalid.forEach(v => {
    const value = process.env[v];
    const masked = value ? `${value.substring(0, 12)}...` : "empty";
    console.log(`   - ${v}: ${masked} (invalid format)`);
  });
}

console.log("\n" + "=".repeat(50));

if (allValid) {
  console.log("✅ All Stripe configuration is valid!");
  console.log("\nNext steps:");
  console.log("1. Test payment flow at /pricing");
  console.log("2. Verify webhook endpoint is configured");
  console.log("3. Test with Stripe test cards");
  process.exit(0);
} else {
  console.log("❌ Stripe configuration is incomplete!");
  console.log("\nPlease:");
  console.log("1. Set all missing environment variables");
  console.log("2. Fix invalid variable formats");
  console.log("3. See STRIPE-CONFIGURATION-GUIDE.md for details");
  process.exit(1);
}

