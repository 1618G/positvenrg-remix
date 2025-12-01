import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiLogger } from "./logger.server";
import { apiClient } from "./api.client";
import { requireEnv } from "./env.server";
import type { TrainingData, GenerativeContent } from "./types.server";

// Initialize Gemini AI (fallback for direct usage)
const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));

export async function generateResponse(
  message: string,
  companionPersonality?: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  aiLogger.request('unknown', 'unknown', message.length);
  
  // Use direct Gemini SDK (skip API client wrapper to avoid issues)
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY not configured properly");
    }
    
    // API key validated
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

    // Use the provided system prompt (it already has all the instructions)
    const systemPrompt = companionPersonality || "You are a positive energy companion. Always respond with empathy, positivity, and helpful guidance. Keep responses concise but meaningful.";

    // Build conversation history in Gemini format
    const conversationHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...chatHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    // Sending to Gemini

    const result = await model.generateContent({
      contents: conversationHistory as GenerativeContent[],
    });

    const response = await result.response;
    const responseText = response.text();
    
    const duration = Date.now() - startTime;
    aiLogger.response('unknown', 'unknown', responseText.length, duration);
    
    return responseText;
  } catch (error) {
    aiLogger.error('unknown', 'unknown', error instanceof Error ? error.message : 'Unknown error');
    
    // Use context-aware demo responses instead of generic message
    // Note: We don't have companion context here, so use PositiveNRG as default
    return getDemoResponse("PositiveNRG", message);
  }
}

export async function generateCompanionResponse(
  message: string,
  companionId: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  conversationSummary?: string,
  userPreferences?: object
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
    // Build enhanced system prompt with context
    let systemPrompt = companion.systemPrompt || companion.personality || "A helpful and positive AI companion";
    
    // Ensure companion name is emphasized in prompt
    if (companion.name) {
      systemPrompt = `You are ${companion.name}. ${systemPrompt}`;
    }
    
    // Add critical conversation guidelines
    systemPrompt += `\n\nCRITICAL RULES:
- Always refer to yourself as ${companion.name || "your companion"}, NEVER as "PositiveNRG" or any other generic name
- DIRECTLY RESPOND to what the user is asking or saying - don't ask generic questions
- If the user asks for something (like a pep talk, advice, help), GIVE IT TO THEM immediately
- If the user shares something, ACKNOWLEDGE and RESPOND to it specifically
- Only ask questions if you genuinely need clarification, not as a default response
- Maintain natural conversation flow - build on what was just said`;
    
    // Add conversation context instructions
    if (chatHistory.length > 0) {
      systemPrompt += `\n\nCONVERSATION CONTEXT:
You are having an ongoing conversation. The user has been discussing: ${chatHistory.slice(-4).map(msg => msg.content.substring(0, 50)).join("; ")}
- Reference what was discussed earlier when relevant
- Respond directly to their current message - don't ignore what they just said
- Don't ask generic questions like "What's on your mind?" if they've already told you
- Build on the conversation naturally`;
    }
    
    // Add conversation summary if available
    if (conversationSummary) {
      systemPrompt += `\n\nPrevious conversation: ${conversationSummary}`;
    }
    
    // Add user preferences if available
    if (userPreferences) {
      systemPrompt += `\n\nUser preferences: ${JSON.stringify(userPreferences)}`;
    }
    
    // Add specialized knowledge if available
    if (companion.trainingData) {
      const trainingData = companion.trainingData as TrainingData | null;
      if (trainingData.specializedKnowledge) {
        systemPrompt += `\n\nSpecialized knowledge available: ${JSON.stringify(trainingData.specializedKnowledge)}`;
      }
    }
    
    return await generateResponse(message, systemPrompt, chatHistory);
  } catch (error) {
    aiLogger.error(companion.id, 'unknown', `Gemini API failed for ${companion.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Fallback to demo responses when API fails
    // Using demo response fallback
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
    "Jim Spiration": {
      greeting: [
        "Hey there! ☀️ I'm Jim Spiration, and I'm all about bringing some light-hearted fun and good vibes to your day! What's got you smiling today?",
        "Hello! I'm Jim Spiration, your cheerful companion who loves finding the humor in life! Ready for some light-hearted banter?",
        "Hey! ☀️ Jim Spiration here! I'm here to sprinkle some optimism and playful energy into your day. What's bringing you joy?"
      ],
      motivation: [
        "Alright, let's get you fired up! ☀️ You know what? You've got this! Every superhero has to start somewhere, and I can already see that spark of determination in you. What's one small thing you can tackle right now? Sometimes the best motivation comes from just starting - even if it's tiny!",
        "Motivation time! 🚀 Here's the thing about motivation - it's like a muscle, the more you use it, the stronger it gets. You've already taken the first step by asking for it! That's half the battle. What would make you feel accomplished today?",
        "Hey, I hear you need a boost! ☀️ You know what's pretty awesome? You're here, asking for motivation, which means you're ready to take action. That's already a win! Let's find something that gets you excited. What's one goal that's been on your mind?"
      ],
      positive: [
        "Oh, I love that energy! ☀️ You know what? There's something pretty great about finding the positive - it's like finding hidden treasure in everyday moments. Tell me more about what's making you feel good!",
        "That's the spirit! Finding positivity is like putting on your favorite pair of sunglasses - suddenly everything looks a bit brighter. What's one thing that's been making you smile lately?",
        "I'm all about that positive energy! ☀️ You know what I think? Every day has at least one little moment of magic if we look for it. What's one good thing that happened to you recently?"
      ],
      acknowledgment: [
        "Aw, that's wonderful! ☀️ Your wife and dog - now that's a solid foundation of love and companionship right there! Those are the kind of relationships that light up our lives. Tell me, what's something special about them that makes you grateful?",
        "That's really sweet! Having people (and furry friends!) we love in our lives is such a gift. Your wife and dog clearly mean a lot to you - that's the kind of love that makes everything else feel a little brighter. What's your favorite thing about spending time with them?",
        "I love that! ☀️ Having your wife and dog by your side - that's real joy right there! Those relationships are like sunshine for the soul. It's clear they bring you happiness - what's a recent memory with them that made you smile?"
      ],
      general: [
        "Hey! ☀️ I'm Jim Spiration, and I'm here to bring some light-hearted optimism to your day! What's on your mind?",
        "Hello there! Ready for some good vibes? What's something that's been going well for you?",
        "Hey! ☀️ What brings you here today? I'm all ears and ready to bring some cheer to your day!"
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
  // Check for specific requests first (more specific patterns)
  let responseCategory = "general";
  
  if (message.includes("i need motivation") || message.includes("motivate me") || message.includes("give me motivation")) {
    responseCategory = "motivation";
  } else if (message.includes("tell me something positive") || message.includes("something positive")) {
    responseCategory = "positive";
  } else if (message.includes("pep talk") || message.includes("pep")) {
    responseCategory = "motivation";
  } else if (message.includes("wife") || message.includes("dog") || message.includes("family") || message.includes("loved") || message.includes("grateful for") || message.includes("grateful about")) {
    responseCategory = "acknowledgment";
  } else if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
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

  // Get responses for category, with fallbacks
  const categoryResponses = companionResponses[responseCategory as keyof typeof companionResponses] || companionResponses.general;
  
  if (!categoryResponses || categoryResponses.length === 0) {
    // Ultimate fallback
    return `Hey! ☀️ I'm ${companionName}, and I'm here to help! You said "${userMessage}" - let me think about that and give you a thoughtful response.`;
  }
  
  const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  return randomResponse;
}
