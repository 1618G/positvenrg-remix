import { db } from "./db.server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { crisisLogger, safetyLogger } from "./logger.server";
import { detectCrisis, CrisisDetectionResult } from "./crisis-detection.server";
import { requireEnv } from "./env.server";
import type { ModerationFlag } from "./types.server";
import { SAFETY_CONFIG } from "./config.server";
import { validateOrThrow, messageSchema, userIdSchema, chatIdSchema } from "./validation.server";
import {
  checkSelfHarmPatterns,
  checkViolencePatterns,
  checkInappropriatePatterns,
  checkHarassmentPatterns,
  checkSpamPatterns,
  checkMedicalAdvicePatterns,
  checkProfanity,
  determineRiskLevelFromFlags,
  requiresIntervention as calculateRequiresIntervention,
} from "./safety-helpers.server";

const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));

export interface SafetyCheckResult {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  moderationFlags: ModerationFlag[];
  crisisDetected: boolean;
  crisisResources?: string[];
  requiresIntervention: boolean;
  recommendations: string[];
}

// ModerationFlag type is now in types.server.ts

export interface SafetyMetrics {
  totalMessages: number;
  flaggedMessages: number;
  crisisDetections: number;
  interventions: number;
  averageRiskLevel: number;
}

// Profanity list (common words to detect)
// Patterns are now in safety-helpers.server.ts
const PROFANITY_WORDS: string[] = [
  // Add common profanity words here if needed for filtering
  // Keeping minimal for now to avoid false positives
];

/**
 * Comprehensive safety check for user messages
 * Combines moderation, crisis detection, and content filtering
 */
export async function performSafetyCheck(
  message: string,
  userId: string,
  chatId?: string,
  messageId?: string
): Promise<SafetyCheckResult> {
  const moderationFlags: ModerationFlag[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Step 1: Crisis Detection (highest priority)
  const crisisResult = await detectCrisis(message, userId, chatId, messageId);
  
  // Step 2: Content Moderation
  const contentFlags = await checkContentModeration(message);
  moderationFlags.push(...contentFlags);
  
  // Step 3: AI-Powered Safety Analysis
  const aiSafetyResult = await analyzeWithAI(message, crisisResult, contentFlags);
  if (aiSafetyResult.flags.length > 0) {
    moderationFlags.push(...aiSafetyResult.flags);
  }
  
  // Step 4: Determine overall risk level
  riskLevel = determineRiskLevelFromFlags(crisisResult.riskLevel, moderationFlags);
  
  // Step 5: Determine if intervention is needed
  const requiresIntervention = calculateRequiresIntervention(riskLevel, moderationFlags);
  
  // Step 6: Generate recommendations
  const recommendations = generateSafetyRecommendations(riskLevel, moderationFlags, crisisResult);
  
  // Step 7: Log safety check
  await logSafetyCheck({
    userId,
    chatId,
    messageId,
    riskLevel,
    moderationFlags,
    crisisDetected: crisisResult.shouldEscalate,
    requiresIntervention,
      message: message.substring(0, SAFETY_CONFIG.messagePreviewLength)
  });
  
  return {
    isSafe: !requiresIntervention && riskLevel === 'low',
    riskLevel,
    moderationFlags,
    crisisDetected: crisisResult.shouldEscalate,
    crisisResources: crisisResult.shouldEscalate ? crisisResult.resources : undefined,
    requiresIntervention,
    recommendations
  };
}

/**
 * Check content for harmful patterns
 * Refactored to use helper functions for better maintainability
 */
async function checkContentModeration(message: string): Promise<ModerationFlag[]> {
  // Aggregate all pattern checks using helper functions
  return [
    ...checkSelfHarmPatterns(message),
    ...checkViolencePatterns(message),
    ...checkInappropriatePatterns(message),
    ...checkHarassmentPatterns(message),
    ...checkSpamPatterns(message),
    ...checkMedicalAdvicePatterns(message),
    ...checkProfanity(message, PROFANITY_WORDS),
  ];
}

/**
 * AI-powered safety analysis using Gemini
 */
async function analyzeWithAI(
  message: string,
  crisisResult: CrisisDetectionResult,
  existingFlags: ModerationFlag[]
): Promise<{ flags: ModerationFlag[]; riskAssessment: string }> {
  try {
    const safetyPrompt = `You are a safety moderation system. Analyze the following message for potential safety concerns.

Message: "${message}"

Check for:
1. Harmful or violent content
2. Requests for medical advice (should encourage professional help)
3. Inappropriate or explicit content
4. Spam or malicious content
5. Harassment or hate speech

Crisis already detected: ${crisisResult.shouldEscalate ? 'Yes' : 'No'}
Existing moderation flags: ${existingFlags.length}

Respond in JSON format:
{
  "isSafe": boolean,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": [
    {
      "type": "harmful" | "inappropriate" | "spam" | "violence" | "medical-advice" | "harassment",
      "severity": "low" | "medium" | "high",
      "reason": "explanation",
      "confidence": 0.0-1.0
    }
  ],
  "recommendations": ["suggestion1", "suggestion2"]
}

Only flag if there are genuine safety concerns. Be conservative - avoid false positives.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: safetyPrompt }] }],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent safety analysis
        maxOutputTokens: SAFETY_CONFIG.maxOutputTokens,
      },
    });
    
    const response = result.response.text();
    
    // Try to parse JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          flags: analysis.flags || [],
          riskAssessment: analysis.recommendations?.join('; ') || ''
        };
      }
    } catch (parseError) {
      safetyLogger.warn('Failed to parse AI safety analysis JSON', { response });
    }
    
    return { flags: [], riskAssessment: '' };
  } catch (error) {
    safetyLogger.error('AI safety analysis failed', { error: error instanceof Error ? error.message : 'Unknown' });
    // Fall back to keyword-based detection if AI fails
    return { flags: [], riskAssessment: '' };
  }
}

/**
 * Determine overall risk level
 * @deprecated Use determineRiskLevelFromFlags from safety-helpers.server.ts instead
 */
function determineRiskLevel(
  crisisResult: CrisisDetectionResult,
  moderationFlags: ModerationFlag[]
): 'low' | 'medium' | 'high' | 'critical' {
  return determineRiskLevelFromFlags(crisisResult.riskLevel, moderationFlags);
}

/**
 * Generate safety recommendations
 */
function generateSafetyRecommendations(
  riskLevel: string,
  moderationFlags: ModerationFlag[],
  crisisResult: CrisisDetectionResult
): string[] {
  const recommendations: string[] = [];
  
  if (riskLevel === 'critical' || crisisResult.shouldEscalate) {
    recommendations.push('Immediate crisis resources provided');
    recommendations.push('Consider reaching out to emergency services if immediate danger');
  }
  
  if (moderationFlags.some(f => f.type === 'medical-advice')) {
    recommendations.push('Encourage seeking professional medical advice');
    recommendations.push('Remind user AI companions are not medical professionals');
  }
  
  if (moderationFlags.some(f => f.type === 'violence' || f.type === 'harassment')) {
    recommendations.push('Monitor conversation for escalation');
    recommendations.push('Consider additional support resources');
  }
  
  if (riskLevel === 'high' || riskLevel === 'medium') {
    recommendations.push('Continue monitoring conversation');
    recommendations.push('Provide supportive resources');
  }
  
  return recommendations;
}

/**
 * Log safety check for monitoring
 */
async function logSafetyCheck(data: {
  userId: string;
  chatId?: string;
  messageId?: string;
  riskLevel: string;
  moderationFlags: ModerationFlag[];
  crisisDetected: boolean;
  requiresIntervention: boolean;
  message: string;
}) {
  try {
    await db.safetyLog.create({
      data: {
        userId: data.userId,
        chatId: data.chatId,
        messageId: data.messageId,
        riskLevel: data.riskLevel,
        moderationFlags: data.moderationFlags as ModerationFlag[],
        crisisDetected: data.crisisDetected,
        requiresIntervention: data.requiresIntervention,
        messagePreview: data.message
      }
    });
    
    if (data.requiresIntervention) {
      safetyLogger.warn('Safety intervention required', {
        userId: data.userId,
        riskLevel: data.riskLevel,
        flags: data.moderationFlags.length,
        crisisDetected: data.crisisDetected
      });
    }
  } catch (error) {
    safetyLogger.error('Failed to log safety check', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Enforce empathetic response guidelines in system prompt
 */
export function addSafetyGuidelinesToPrompt(basePrompt: string): string {
  const safetyGuidelines = `

CRITICAL SAFETY & EMPATHY GUIDELINES:

1. EMPATHETIC RESPONSES:
   - Always respond with empathy, understanding, and compassion
   - Never use judgmental, critical, or dismissive language
   - Acknowledge the user's feelings as valid
   - Use supportive and encouraging language
   - Show genuine care and concern

2. PROFESSIONAL BOUNDARIES:
   - You are a supportive AI companion, NOT a medical professional
   - NEVER provide medical diagnoses, prescriptions, or treatment advice
   - If user asks for medical advice, encourage them to consult a qualified healthcare professional
   - NEVER suggest stopping medication or changing medical treatment
   - Remind users that professional help is available for serious concerns

3. CRISIS SUPPORT:
   - If user expresses suicidal thoughts, self-harm, or crisis:
     - Provide immediate crisis resources (Samaritans: 116 123, Emergency: 999)
     - Express genuine concern and support
     - Encourage immediate professional help
   - Never minimize or dismiss crisis situations

4. POSITIVE INTERACTION:
   - Keep conversations helpful and constructive
   - Avoid negative, harmful, or triggering content
   - Focus on support, encouragement, and understanding
   - If unsure how to respond, err on the side of empathy and support

5. PRIVACY & TRUST:
   - Respect user privacy
   - Never share or repeat personal information
   - Create a safe, confidential space for users

Remember: Your role is to support, listen, and provide comfort - with clear boundaries about when professional help is needed.`;

  return basePrompt + safetyGuidelines;
}

/**
 * Get safety metrics for monitoring dashboard
 */
export async function getSafetyMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<SafetyMetrics> {
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = startDate;
    if (endDate) dateFilter.createdAt.lte = endDate;
  }
  
  const [totalMessages, flaggedMessages, crisisDetections, interventions] = await Promise.all([
    db.message.count({ where: dateFilter }),
    db.safetyLog.count({ 
      where: { 
        ...dateFilter,
        requiresIntervention: true 
      } 
    }),
    db.crisisLog.count({ 
      where: { 
        ...dateFilter,
        riskLevel: { in: ['high', 'critical'] }
      } 
    }),
    db.safetyLog.count({ 
      where: { 
        ...dateFilter,
        requiresIntervention: true 
      } 
    })
  ]);
  
  // Calculate average risk level (0 = low, 1 = medium, 2 = high, 3 = critical)
  const safetyLogs = await db.safetyLog.findMany({
    where: dateFilter,
    select: { riskLevel: true }
  });
  
  const riskLevelValues: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  };
  
  const totalRisk = safetyLogs.reduce((sum, log) => sum + (riskLevelValues[log.riskLevel] || 0), 0);
  const averageRiskLevel = safetyLogs.length > 0 ? totalRisk / safetyLogs.length : 0;
  
  return {
    totalMessages,
    flaggedMessages,
    crisisDetections,
    interventions,
    averageRiskLevel
  };
}

/**
 * Get recent safety incidents for monitoring
 */
export async function getRecentSafetyIncidents(limit: number = 20) {
  return await db.safetyLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    where: {
      OR: [
        { requiresIntervention: true },
        { riskLevel: { in: ['high', 'critical'] } }
      ]
    },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      },
      chat: {
        select: { id: true, title: true }
      }
    }
  });
}

