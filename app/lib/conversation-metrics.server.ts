/**
 * Conversation quality metrics
 * Extracted from conversation-handler.server.ts for better organization
 */

import { db } from "./db.server";
import { handleDatabaseError } from "./errors.server";
import { PERFORMANCE_CONFIG } from "./config.server";

/**
 * Get conversation quality metrics for a chat
 */
export async function getConversationQualityMetrics(chatId: string): Promise<{
  messageCount: number;
  averageResponseTime: number;
  crisisDetections: number;
  knowledgeUsage: number;
  featureSuggestions: number;
  userSatisfaction: number;
}> {
  try {
    const messages = await db.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        safetyLogs: true,
      }
    });
    
    // Calculate average response time
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i];
      const prev = messages[i - 1];
      
      if (curr.role === 'ASSISTANT' && prev.role === 'USER') {
        responseTimes.push(curr.createdAt.getTime() - prev.createdAt.getTime());
      }
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / PERFORMANCE_CONFIG.responseTimeConversion
      : 0;
    
    // Count crisis detections
    const crisisLogs = messages.reduce((count, msg) => {
      return count + msg.safetyLogs.filter(log => log.crisisDetected).length;
    }, 0);
    
    // Extract knowledge usage and feature suggestions from metadata
    let knowledgeUsage = 0;
    let featureSuggestions = 0;
    
    for (const msg of messages) {
      if (msg.role === 'ASSISTANT' && msg.metadata) {
        const metadata = msg.metadata as any;
        if (metadata.knowledgeUsed && Array.isArray(metadata.knowledgeUsed)) {
          knowledgeUsage += metadata.knowledgeUsed.length;
        }
        if (metadata.featuresSuggested && Array.isArray(metadata.featuresSuggested)) {
          featureSuggestions += metadata.featuresSuggested.length;
        }
      }
    }
    
    return {
      messageCount: messages.length,
      averageResponseTime,
      crisisDetections: crisisLogs,
      knowledgeUsage,
      featureSuggestions,
      userSatisfaction: 0 // Would need user feedback system
    };
  } catch (error) {
    const dbError = handleDatabaseError(error, 'getConversationQualityMetrics', { chatId });
    dbError.log();
    return {
      messageCount: 0,
      averageResponseTime: 0,
      crisisDetections: 0,
      knowledgeUsage: 0,
      featureSuggestions: 0,
      userSatisfaction: 0
    };
  }
}

