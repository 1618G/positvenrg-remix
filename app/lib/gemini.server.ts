import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiLogger } from "./logger.server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(
  message: string,
  companionPersonality?: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

    const systemPrompt = companionPersonality 
      ? `You are a positive energy companion with the following personality: ${companionPersonality}. Always respond with empathy, positivity, and helpful guidance. Keep responses concise but meaningful.`
      : "You are a positive energy companion. Always respond with empathy, positivity, and helpful guidance. Keep responses concise but meaningful.";

    // Build conversation history
    const conversationHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...chatHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const result = await model.generateContent({
      contents: conversationHistory as any,
    });

    const response = await result.response;
    const responseText = response.text();
    
    const duration = Date.now() - startTime;
    aiLogger.response('unknown', 'unknown', responseText.length, duration);
    
    return responseText;
  } catch (error) {
    const duration = Date.now() - startTime;
    aiLogger.error('unknown', 'unknown', error instanceof Error ? error.message : 'Unknown error');
    return "I'm sorry, I'm having trouble processing your message right now. Please try again.";
  }
}

export async function generateCompanionResponse(
  message: string,
  companionId: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  // Get companion details from database
  const { db } = require("./db.server");
  const companion = await db.companion.findUnique({
    where: { id: companionId },
  });

  if (!companion) {
    throw new Error("Companion not found");
  }

  return generateResponse(message, companion.personality || "A helpful and positive AI companion", chatHistory);
}
