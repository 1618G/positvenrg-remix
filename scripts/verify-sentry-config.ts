#!/usr/bin/env tsx
/**
 * Verify Sentry configuration
 * Checks that Sentry is properly configured for error monitoring
 */

console.log("🔍 Verifying Sentry Configuration...\n");

const requiredVars = ["SENTRY_DSN"];
const optionalVars = ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"];

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

  // Validate DSN format
  if (varName === "SENTRY_DSN") {
    const isValid = value.startsWith("https://") && value.includes("@") && value.includes(".ingest.sentry.io/");
    if (!isValid) {
      invalid.push(varName);
      allValid = false;
    }
  }
}

// Check optional variables (for source maps)
let sourceMapsConfigured = true;
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    sourceMapsConfigured = false;
  }
}

// Report results
if (allValid) {
  console.log("✅ Sentry Configuration:");
  const dsn = process.env.SENTRY_DSN;
  const masked = dsn ? `${dsn.substring(0, 20)}...` : "not set";
  console.log(`   DSN: ${masked}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  
  if (sourceMapsConfigured) {
    console.log("\n✅ Source Maps Configuration:");
    console.log("   Auth Token: Set");
    console.log("   Org: " + (process.env.SENTRY_ORG || "not set"));
    console.log("   Project: " + (process.env.SENTRY_PROJECT || "not set"));
  } else {
    console.log("\n⚠️  Source Maps Not Fully Configured:");
    console.log("   To enable source maps in error reports, set:");
    console.log("   - SENTRY_AUTH_TOKEN");
    console.log("   - SENTRY_ORG");
    console.log("   - SENTRY_PROJECT");
  }
} else {
  console.log("❌ Sentry Configuration:");
  if (missing.length > 0) {
    console.log("\n❌ Missing Variables:");
    missing.forEach(v => console.log(`   - ${v}`));
  }
  if (invalid.length > 0) {
    console.log("\n⚠️  Invalid Variables:");
    invalid.forEach(v => {
      const value = process.env[v];
      const masked = value ? `${value.substring(0, 20)}...` : "empty";
      console.log(`   - ${v}: ${masked} (invalid format)`);
    });
  }
}

console.log("\n" + "=".repeat(50));

if (allValid) {
  console.log("✅ Sentry is configured!");
  console.log("\nNext steps:");
  console.log("1. Test error tracking by visiting a non-existent route");
  console.log("2. Check Sentry Dashboard for events");
  console.log("3. Configure alerts for critical errors");
  if (!sourceMapsConfigured) {
    console.log("4. Set up source maps for better error reports (optional)");
  }
  process.exit(0);
} else {
  console.log("❌ Sentry configuration is incomplete!");
  console.log("\nPlease:");
  console.log("1. Create a Sentry account at https://sentry.io");
  console.log("2. Create a new Remix project");
  console.log("3. Copy your DSN and set SENTRY_DSN environment variable");
  console.log("4. See SENTRY-SETUP-GUIDE.md for details");
  process.exit(1);
}

