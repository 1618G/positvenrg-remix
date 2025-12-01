#!/usr/bin/env tsx
/**
 * Verify Email configuration
 * Checks that email service is properly configured
 */

console.log("🔍 Verifying Email Configuration...\n");

const providers = {
  gmail: {
    required: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    optional: ["FROM_EMAIL", "BASE_URL"],
    name: "Gmail SMTP",
  },
  sendgrid: {
    required: ["SENDGRID_API_KEY"],
    optional: ["FROM_EMAIL", "BASE_URL"],
    name: "SendGrid",
  },
  resend: {
    required: ["RESEND_API_KEY"],
    optional: ["FROM_EMAIL", "BASE_URL"],
    name: "Resend",
  },
};

let configuredProvider: string | null = null;
const missing: string[] = [];
const invalid: string[] = [];

// Check which provider is configured
for (const [key, config] of Object.entries(providers)) {
  const hasAllRequired = config.required.every(
    (varName) => process.env[varName] && process.env[varName]!.trim() !== ""
  );

  if (hasAllRequired) {
    configuredProvider = key;
    break;
  }
}

// If no provider configured, check what's missing
if (!configuredProvider) {
  console.log("❌ No email provider configured!\n");
  
  console.log("Available providers:");
  for (const [key, config] of Object.entries(providers)) {
    console.log(`\n${config.name}:`);
    const missingVars = config.required.filter(
      (varName) => !process.env[varName] || process.env[varName]!.trim() === ""
    );
    
    if (missingVars.length > 0) {
      console.log(`   Missing: ${missingVars.join(", ")}`);
    } else {
      console.log(`   ✅ All required variables set`);
    }
  }
  
  console.log("\n📝 Setup Instructions:");
  console.log("   See EMAIL-SETUP-GUIDE.md for detailed setup");
  process.exit(1);
}

const provider = providers[configuredProvider as keyof typeof providers];
console.log(`✅ Email Provider: ${provider.name}\n`);

// Validate configured provider
for (const varName of provider.required) {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    missing.push(varName);
    continue;
  }

  // Validate format
  let isValid = true;
  if (varName === "SENDGRID_API_KEY") {
    isValid = value.startsWith("SG.");
  } else if (varName === "RESEND_API_KEY") {
    isValid = value.startsWith("re_");
  } else if (varName === "GMAIL_APP_PASSWORD") {
    isValid = value.length === 16 && !value.includes(" ");
  }

  if (!isValid) {
    invalid.push(varName);
  }
}

// Check optional variables
const BASE_URL = process.env.BASE_URL || "http://localhost:8780";
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.GMAIL_USER || "noreply@positivenrg.com";

// Report results
console.log("✅ Configured Variables:");
for (const varName of provider.required) {
  if (!missing.includes(varName) && !invalid.includes(varName)) {
    const value = process.env[varName];
    const masked = varName.includes("PASSWORD") || varName.includes("KEY")
      ? `${value?.substring(0, 8)}...`
      : value;
    console.log(`   ${varName}: ${masked}`);
  }
}

console.log(`\n📧 Email Settings:`);
console.log(`   From: ${FROM_EMAIL}`);
console.log(`   Base URL: ${BASE_URL}`);

if (missing.length > 0) {
  console.log("\n❌ Missing Variables:");
  missing.forEach(v => console.log(`   - ${v}`));
}

if (invalid.length > 0) {
  console.log("\n⚠️  Invalid Variables:");
  invalid.forEach(v => {
    const value = process.env[v];
    const masked = value ? `${value.substring(0, 8)}...` : "empty";
    console.log(`   - ${v}: ${masked} (invalid format)`);
  });
}

console.log("\n" + "=".repeat(50));

if (missing.length === 0 && invalid.length === 0) {
  console.log("✅ Email configuration is valid!");
  console.log("\nNote: Email service is configured.");
  console.log("In development, if emails aren't sent, the app will use dummy verification codes.");
  console.log("\nNext steps:");
  console.log("1. Test email sending by registering a new user");
  console.log("2. Check spam folder if emails don't arrive");
  console.log("3. Monitor email deliverability");
  process.exit(0);
} else {
  console.log("❌ Email configuration is incomplete!");
  console.log("\nPlease:");
  console.log("1. Set all missing environment variables");
  console.log("2. Fix invalid variable formats");
  console.log("3. See EMAIL-SETUP-GUIDE.md for details");
  process.exit(1);
}

