import { db } from "./db.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationSummary {
  id: string;
  summary: string;
  keyPoints: any;
  sentiment: string;
  topics: string[];
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  preferences: any;
  triggers: any;
  goals: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateConversationSummary(
  chatId: string,
  messages: Array<{ role: string; content: string; createdAt: Date }>
): Promise<ConversationSummary> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Create conversation context for summarization
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const summaryPrompt = `Please analyze this conversation and provide:
1. A concise summary (2-3 sentences)
2. Key points and important information
3. Overall sentiment (positive, negative, neutral, mixed)
4. Main topics discussed

Conversation:
${conversationText}

Respond in JSON format:
{
  "summary": "Brief summary of the conversation",
  "keyPoints": {
    "userPreferences": ["preference1", "preference2"],
    "triggers": ["trigger1", "trigger2"],
    "goals": ["goal1", "goal2"],
    "importantInfo": ["info1", "info2"]
  },
  "sentiment": "overall sentiment",
  "topics": ["topic1", "topic2", "topic3"]
}`;

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const summaryText = response.text();
    
    // Parse JSON response
    const summaryData = JSON.parse(summaryText);
    
    // Save to database
    const summary = await db.conversationSummary.create({
      data: {
        chatId,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints,
        sentiment: summaryData.sentiment,
        topics: summaryData.topics
      }
    });
    
    return {
      id: summary.id,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      sentiment: summary.sentiment || 'neutral',
      topics: summary.topics as string[],
      createdAt: summary.createdAt
    };
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    
    // Fallback to simple summary
    const fallbackSummary = `Conversation with ${messages.length} messages. Topics discussed: ${messages.map(m => m.content.substring(0, 50)).join(', ')}`;
    
    const summary = await db.conversationSummary.create({
      data: {
        chatId,
        summary: fallbackSummary,
        keyPoints: {},
        sentiment: 'neutral',
        topics: []
      }
    });
    
    return {
      id: summary.id,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      sentiment: summary.sentiment || 'neutral',
      topics: summary.topics as string[],
      createdAt: summary.createdAt
    };
  }
}

export async function getConversationContext(
  chatId: string,
  limit: number = 10
): Promise<{
  recentMessages: Array<{ role: string; content: string; createdAt: Date }>;
  summary?: ConversationSummary;
  userPreferences?: UserPreferences;
}> {
  try {
    // Get recent messages
    const messages = await db.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    // Get latest conversation summary
    const summary = await db.conversationSummary.findFirst({
      where: { chatId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get user preferences if available
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          include: {
            preferences: {
              orderBy: { updatedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });
    
    const userPreferences = chat?.user?.preferences?.[0];
    
    return {
      recentMessages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt
      })),
      summary: summary ? {
        id: summary.id,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        sentiment: summary.sentiment || 'neutral',
        topics: summary.topics as string[],
        createdAt: summary.createdAt
      } : undefined,
      userPreferences: userPreferences ? {
        id: userPreferences.id,
        preferences: userPreferences.preferences,
        triggers: userPreferences.triggers,
        goals: userPreferences.goals,
        createdAt: userPreferences.createdAt,
        updatedAt: userPreferences.updatedAt
      } : undefined
    };
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return {
      recentMessages: [],
      summary: undefined,
      userPreferences: undefined
    };
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: any,
  triggers?: any,
  goals?: any
): Promise<UserPreferences> {
  try {
    const existing = await db.userPreference.findFirst({
      where: { userId }
    });
    
    if (existing) {
      const updated = await db.userPreference.update({
        where: { id: existing.id },
        data: {
          preferences: { ...existing.preferences, ...preferences },
          triggers: triggers ? { ...existing.triggers, ...triggers } : existing.triggers,
          goals: goals ? { ...existing.goals, ...goals } : existing.goals
        }
      });
      
      return {
        id: updated.id,
        preferences: updated.preferences,
        triggers: updated.triggers,
        goals: updated.goals,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    } else {
      const created = await db.userPreference.create({
        data: {
          userId,
          preferences,
          triggers: triggers || {},
          goals: goals || {}
        }
      });
      
      return {
        id: created.id,
        preferences: created.preferences,
        triggers: created.triggers,
        goals: created.goals,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      };
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

export async function getConversationHistory(
  chatId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string; createdAt: Date; metadata?: any }>> {
  try {
    const messages = await db.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
    
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      metadata: msg.metadata
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

export async function saveMessage(
  chatId: string,
  userId: string,
  role: 'USER' | 'ASSISTANT' | 'SYSTEM',
  content: string,
  metadata?: any
): Promise<void> {
  try {
    await db.message.create({
      data: {
        chatId,
        userId,
        role,
        content,
        metadata
      }
    });
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

export async function shouldGenerateSummary(
  chatId: string,
  messageCount: number
): Promise<boolean> {
  try {
    // Generate summary every 10 messages or if no summary exists
    const existingSummary = await db.conversationSummary.findFirst({
      where: { chatId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!existingSummary) {
      return messageCount >= 5; // Generate first summary after 5 messages
    }
    
    // Check if enough time has passed since last summary (24 hours)
    const hoursSinceLastSummary = (Date.now() - existingSummary.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSummary >= 24 || messageCount >= 10;
  } catch (error) {
    console.error('Error checking if summary should be generated:', error);
    return false;
  }
}

export async function cleanupOldSummaries(olderThanDays: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    await db.conversationSummary.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old summaries:', error);
  }
}

export async function getMemoryStats(): Promise<{
  totalSummaries: number;
  totalPreferences: number;
  recentSummaries: ConversationSummary[];
}> {
  try {
    const totalSummaries = await db.conversationSummary.count();
    const totalPreferences = await db.userPreference.count();
    
    const recentSummaries = await db.conversationSummary.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      totalSummaries,
      totalPreferences,
      recentSummaries: recentSummaries.map(summary => ({
        id: summary.id,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        sentiment: summary.sentiment || 'neutral',
        topics: summary.topics as string[],
        createdAt: summary.createdAt
      }))
    };
  } catch (error) {
    console.error('Error getting memory stats:', error);
    return {
      totalSummaries: 0,
      totalPreferences: 0,
      recentSummaries: []
    };
  }
}
