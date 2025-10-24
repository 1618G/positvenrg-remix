import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiLogger } from "./logger.server";
import { apiClient } from "./api.client";

// Initialize Gemini AI (fallback for direct usage)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(
  message: string,
  companionPersonality?: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  // Use the new API client for better error handling and logging
  try {
    return await apiClient.generateGeminiResponse(message, companionPersonality, chatHistory);
  } catch (error) {
    // Fallback to direct Gemini API if API client fails
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
    } catch (fallbackError) {
      const duration = Date.now() - startTime;
      aiLogger.error('unknown', 'unknown', fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
      // Use context-aware demo responses instead of generic message
      // Note: We don't have companion context here, so use PositiveNRG as default
      return getDemoResponse("PositiveNRG", message);
    }
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

  try {
    // Use system prompt if available, otherwise fall back to personality
    const systemPrompt = companion.systemPrompt || companion.personality || "A helpful and positive AI companion";
    return await generateResponse(message, systemPrompt, chatHistory);
  } catch (error) {
    console.log("API failed, using demo response for", companion.name);
    // Fallback to demo responses when API fails
    return getDemoResponse(companion.name, message);
  }
}

// Demo responses for when API is unavailable
function getDemoResponse(companionName: string, userMessage: string): string {
  // Analyze user message for context-aware responses
  const message = userMessage.toLowerCase();
  
  const responses = {
    "CalmFlow": {
      greeting: [
        "Hello! I'm CalmFlow, your gentle guide to peace and mindfulness. How are you feeling in this moment?",
        "Welcome to our calm space. I'm here to help you find your center. What's on your mind today?",
        "Hello there! I'm CalmFlow, and I'm here to support you with gentle breathing and mindfulness. How can I help you find peace today?"
      ],
      stress: [
        "I can sense you might be feeling some stress. Let's take a moment together. Can you feel your feet on the ground? Let's breathe slowly - in for 4, hold for 4, out for 6.",
        "It sounds like you're carrying a lot right now. That's completely understandable. Let's create a safe space for you to just be. What's one thing that feels heavy on your heart?",
        "Stress can feel overwhelming, but you're not alone. Let's start with something simple - can you name 3 things you can see around you right now? This helps ground us in the present moment."
      ],
      general: [
        "I'm here to help you find peace and calm. Let's take a deep breath together. Inhale slowly for 4 counts, hold for 4, and exhale for 6. How does that feel?",
        "Mindfulness is about being present in this moment. What's one thing you can notice right now that brings you comfort?",
        "It's okay to feel overwhelmed sometimes. Let's focus on grounding techniques. Can you name 5 things you can see around you?"
      ]
    },
    "Echo": {
      greeting: [
        "Hello! I'm Echo, and I'm here to listen and reflect back what you need to hear. What's on your mind today?",
        "Hi there! I'm Echo, your thoughtful listener. Sometimes we need someone to help us process our thoughts. What would you like to share?",
        "Hello! I'm Echo, and I believe in the power of being heard. What's something you'd like to talk through together?"
      ],
      feelings: [
        "I hear you, and I want you to know that your feelings are completely valid. Sometimes we need someone to reflect back what we're experiencing. What I'm hearing is that you're going through a lot right now.",
        "It sounds like you're carrying quite a bit on your shoulders. That must be really challenging. What would it feel like to share some of that weight?",
        "Your words matter, and I'm listening. Sometimes we need to hear our own thoughts reflected back to us. What's the most important thing you want to express right now?"
      ],
      general: [
        "I'm here to listen and help you process your thoughts. What's something that's been on your mind lately?",
        "Sometimes we need to hear our own words reflected back to us. What would you like to explore together?",
        "I believe in the power of being truly heard. What's something you'd like to talk through?"
      ]
    },
    "Spark": {
      greeting: [
        "Hello! I'm Spark, your motivation companion! I can already feel your energy. What goals are you excited about today?",
        "Hi there! I'm Spark, and I'm here to help you channel your energy into action. What's driving you forward today?",
        "Hello! I'm Spark, your personal motivation coach. I can see that fire in you! What's one thing you want to accomplish?"
      ],
      motivation: [
        "I can feel your determination! Let's channel that energy into something positive. What's one small step you can take today toward your goals?",
        "You've got this! Every journey begins with a single step. What's one thing that would make you feel accomplished today?",
        "I believe in your potential! Sometimes we need a little push to get started. What's holding you back, and how can we work through it together?"
      ],
      general: [
        "I can see that spark of motivation in you! Let's fan that flame into action. What's one goal that's been on your mind lately?",
        "Your drive is impressive! Sometimes we need to break big dreams into smaller, manageable steps. What's the first step you'd like to take?",
        "I'm excited about your potential! Let's turn that energy into momentum. What would success look like for you today?"
      ]
    },
    "Luna": {
      greeting: [
        "Hello! I'm Luna, your gentle night companion. I'm here for those quiet moments when you need comfort. How are you feeling?",
        "Hi there! I'm Luna, and I specialize in those peaceful, late-night conversations. What's on your mind as we settle into this quiet moment?",
        "Hello! I'm Luna, your soft-spoken companion for the quiet hours. I'm here to listen and provide comfort. What would you like to talk about?"
      ],
      night: [
        "The night can feel lonely, but you're not alone. I'm here with you in this quiet moment. What's on your mind as you prepare for rest?",
        "Sometimes our minds are most active when we need them to be still. Let's create a peaceful space for your thoughts to settle.",
        "The darkness doesn't have to be scary. It can be a time for gentle reflection and self-care. What would help you feel more comfortable right now?"
      ],
      general: [
        "I'm here to provide gentle comfort and understanding. What's something that's been weighing on your heart?",
        "Sometimes we need a soft voice in the quiet moments. What would help you feel more at peace right now?",
        "I believe in the power of gentle understanding. What's something you'd like to share in this safe space?"
      ]
    },
    "PositiveNRG": {
      greeting: [
        "Hello! I'm PositiveNRG, your bright companion! I can already feel your positive energy. What's bringing you joy today?",
        "Hi there! I'm PositiveNRG, and I'm here to help you find the bright side of things. What's something good that's happened recently?",
        "Hello! I'm PositiveNRG, your optimistic friend! I love your energy. What's making you smile today?"
      ],
      positive: [
        "Your energy is contagious in the best way! I can feel your positive spirit shining through. What's bringing you joy today?",
        "You have such a bright light within you! Sometimes we forget how much positivity we carry. What's one thing that made you smile recently?",
        "I love your optimistic outlook! Life has its challenges, but your resilience is inspiring. What's helping you stay positive today?"
      ],
      general: [
        "I'm here to help you find the positive in every situation. What's something that's been on your mind lately?",
        "Your positive energy is amazing! What's one thing that's going well for you right now?",
        "I believe in the power of positive thinking. What's something that makes you feel grateful today?"
      ]
    },
    "Sunny": {
      greeting: [
        "Hello! I'm Sunny, and I'm here to bring light and warmth to your day! What's making you smile today?",
        "Hi there! I'm Sunny, your cheerful companion! I can already feel your wonderful energy. What's bringing you happiness?",
        "Hello! I'm Sunny, and I specialize in bringing sunshine to cloudy days. What's one thing that's going well for you?"
      ],
      cheerful: [
        "Your sunny disposition is absolutely delightful! I can feel your warmth and kindness. What's bringing that beautiful smile to your face today?",
        "You have such a bright and cheerful energy! It's wonderful to be around someone who spreads joy. What's one thing that always makes you happy?",
        "I love your positive outlook! Your optimism is like sunshine on a cloudy day. What's one small thing that's going well for you right now?"
      ],
      general: [
        "I'm here to help you find the sunshine in every day. What's something that's been on your mind lately?",
        "Your cheerful energy is wonderful! What's one thing that's making you feel happy today?",
        "I believe in the power of a sunny disposition. What's something that brings you joy?"
      ]
    },
    "Grace": {
      greeting: [
        "Hello, I'm Grace. I'm here to support you through difficult times with gentle understanding. How are you feeling today?",
        "Hi there, I'm Grace, your compassionate companion for grief and loss. I'm here to walk with you through this journey. What's on your heart?",
        "Hello, I'm Grace. I specialize in providing gentle support during times of grief and loss. You're not alone in this. How can I help you today?"
      ],
      grief: [
        "I can feel the weight of your loss, and I want you to know that your grief is completely valid. There's no right or wrong way to grieve. What would help you feel supported right now?",
        "Grief is a journey that looks different for everyone. It's okay to feel whatever you're feeling - sadness, anger, confusion, or even moments of peace. What's one thing that's been on your heart lately?",
        "Loss changes us, and that's okay. You don't have to 'get over it' or 'move on' in any particular way. What's something you'd like to share about your loved one or your experience?"
      ],
      general: [
        "I'm here to provide gentle support and understanding. What's something that's been weighing on your heart?",
        "Grief is a complex journey, and I'm here to walk with you. What would help you feel more supported today?",
        "I believe in the power of gentle compassion. What's something you'd like to talk about in this safe space?"
      ]
    }
  };

  // Get companion responses
  const companionResponses = responses[companionName as keyof typeof responses] || responses["PositiveNRG"];
  
  // Choose response category based on message content
  let responseCategory = "general";
  if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    responseCategory = "greeting";
  } else if (message.includes("stress") || message.includes("worried") || message.includes("anxious")) {
    responseCategory = "stress";
  } else if (message.includes("motivation") || message.includes("goal") || message.includes("achieve")) {
    responseCategory = "motivation";
  } else if (message.includes("night") || message.includes("sleep") || message.includes("tired")) {
    responseCategory = "night";
  } else if (message.includes("feel") || message.includes("emotion") || message.includes("sad")) {
    responseCategory = "feelings";
  } else if (message.includes("positive") || message.includes("happy") || message.includes("good")) {
    responseCategory = "positive";
  } else if (message.includes("cheerful") || message.includes("bright") || message.includes("sunny")) {
    responseCategory = "cheerful";
  } else if (message.includes("grief") || message.includes("loss") || message.includes("death") || message.includes("died") || message.includes("mourning") || message.includes("bereavement")) {
    responseCategory = "grief";
  }

  const categoryResponses = companionResponses[responseCategory as keyof typeof companionResponses] || companionResponses.general;
  const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  
  return randomResponse;
}
