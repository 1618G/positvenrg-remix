#!/usr/bin/env tsx
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

console.log("🔑 Testing Gemini API Key...\n");

if (!apiKey || apiKey === "your-gemini-api-key-here") {
  console.error("❌ ERROR: GEMINI_API_KEY not set or is placeholder");
  console.log("\nCurrent value:", apiKey ? `${apiKey.substring(0, 10)}...` : "undefined");
  process.exit(1);
}

console.log("✅ API Key found:", `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 5)}`);
console.log("📝 Full key length:", apiKey.length);
console.log("\n🧪 Testing API key with Gemini...\n");

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const result = await model.generateContent("Say 'hello' if you can hear me.");
  const response = await result.response;
  const text = response.text();
  
  console.log("✅ SUCCESS! API key is valid and working!");
  console.log("📨 Response:", text);
} catch (error: any) {
  console.error("❌ FAILED: API key test failed");
  console.error("Error message:", error.message);
  
  if (error.message?.includes("expired") || error.message?.includes("API_KEY_INVALID")) {
    console.error("\n⚠️  The API key has expired or is invalid.");
    console.error("Please create a new API key at: https://aistudio.google.com/apikey");
    console.error("\nOr use gcloud CLI:");
    console.error("  gcloud services api-keys create --display-name='gemini-key-$(date +%Y%m%d)' --api-target=service=generativelanguage.googleapis.com");
  }
  
  process.exit(1);
}
