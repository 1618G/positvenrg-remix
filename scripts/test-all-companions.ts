import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testCompanion(companion: any) {
  const testMessage = "Hello, how are you?";
  
  try {
    const startTime = Date.now();
    
    // Build system prompt
    const systemPrompt = companion.systemPrompt || 
      `You are ${companion.name}, ${companion.description}. ${companion.personality}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: testMessage }] }
      ] as any,
    });

    const response = await result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    return {
      success: true,
      response: responseText.substring(0, 200) + "...",
      duration: `${duration}ms`,
      responseLength: responseText.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: null,
      responseLength: 0,
    };
  }
}

async function testAllCompanions() {
  const companions = await prisma.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      knowledge: {
        where: { isActive: true },
      },
    },
  });

  console.log("\n🧪 TESTING ALL COMPANIONS\n");
  console.log("=".repeat(80));

  const results = [];

  for (const companion of companions) {
    console.log(`\nTesting: ${companion.name} (${companion.avatar})`);
    console.log(`  System Prompt: ${companion.systemPrompt ? "✅" : "❌"}`);
    console.log(`  Knowledge Entries: ${companion.knowledge.length}`);
    
    const result = await testCompanion(companion);
    results.push({ companion: companion.name, ...result });

    if (result.success) {
      console.log(`  ✅ Response Generated (${result.duration})`);
      console.log(`  Response: "${result.response}"`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n📊 SUMMARY\n");

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((acc, r) => acc + parseInt(r.duration || "0"), 0) / successful;

  console.log(`Total Companions: ${companions.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Average Response Time: ${avgDuration.toFixed(0)}ms`);

  if (failed > 0) {
    console.log("\n❌ FAILED COMPANIONS:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.companion}: ${r.error}`);
    });
  }

  console.log("\n");
}

testAllCompanions()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });



