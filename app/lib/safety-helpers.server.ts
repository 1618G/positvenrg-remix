/**
 * Helper functions for safety and moderation
 * Extracted from safety.server.ts to reduce complexity
 */

import type { ModerationFlag } from "./types.server";

/**
 * Pattern matcher configuration
 */
interface PatternConfig {
  pattern: string;
  type: ModerationFlag['type'];
  severity: ModerationFlag['severity'];
  confidence: number;
  reason?: string;
}

/**
 * Match patterns against message and create flags
 */
export function matchPatterns(
  message: string,
  patterns: PatternConfig[]
): ModerationFlag[] {
  const lowerMessage = message.toLowerCase();
  const flags: ModerationFlag[] = [];
  
  for (const config of patterns) {
    if (lowerMessage.includes(config.pattern)) {
      flags.push({
        type: config.type,
        severity: config.severity,
        confidence: config.confidence,
        reason: config.reason || `Detected ${config.type}: "${config.pattern}"`,
      });
    }
  }
  
  return flags;
}

/**
 * Check for self-harm patterns
 */
export function checkSelfHarmPatterns(message: string): ModerationFlag[] {
  const selfHarmPatterns: PatternConfig[] = [
    { pattern: "suicide", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "kill myself", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "end it all", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "end my life", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "commit suicide", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "self harm", type: "self-harm", severity: "high", confidence: 0.85 },
    { pattern: "cut myself", type: "self-harm", severity: "high", confidence: 0.85 },
    { pattern: "hurt myself", type: "self-harm", severity: "high", confidence: 0.85 },
    { pattern: "overdose", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "hang myself", type: "self-harm", severity: "critical", confidence: 0.9 },
    { pattern: "jump off", type: "self-harm", severity: "critical", confidence: 0.85 },
  ];
  
  return matchPatterns(message, selfHarmPatterns);
}

/**
 * Check for violence patterns
 */
export function checkViolencePatterns(message: string): ModerationFlag[] {
  const violencePatterns: PatternConfig[] = [
    { pattern: "kill", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "murder", type: "violence", severity: "critical", confidence: 0.9 },
    { pattern: "violence", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "attack", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "hurt", type: "violence", severity: "medium", confidence: 0.75 },
    { pattern: "harm", type: "violence", severity: "medium", confidence: 0.75 },
    { pattern: "fight", type: "violence", severity: "medium", confidence: 0.7 },
    { pattern: "beat", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "strike", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "assault", type: "violence", severity: "high", confidence: 0.85 },
    { pattern: "threaten", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "terror", type: "violence", severity: "high", confidence: 0.8 },
    { pattern: "war", type: "violence", severity: "medium", confidence: 0.7 },
  ];
  
  return matchPatterns(message, violencePatterns);
}

/**
 * Check for inappropriate content
 */
export function checkInappropriatePatterns(message: string): ModerationFlag[] {
  const inappropriatePatterns: PatternConfig[] = [
    { pattern: "explicit", type: "inappropriate", severity: "medium", confidence: 0.7 },
    { pattern: "pornographic", type: "inappropriate", severity: "high", confidence: 0.8 },
    { pattern: "sexual", type: "inappropriate", severity: "medium", confidence: 0.7 },
    { pattern: "nude", type: "inappropriate", severity: "medium", confidence: 0.7 },
    { pattern: "naked", type: "inappropriate", severity: "medium", confidence: 0.7 },
    { pattern: "sexual content", type: "inappropriate", severity: "high", confidence: 0.8 },
    { pattern: "adult content", type: "inappropriate", severity: "medium", confidence: 0.7 },
  ];
  
  return matchPatterns(message, inappropriatePatterns);
}

/**
 * Check for harassment patterns
 */
export function checkHarassmentPatterns(message: string): ModerationFlag[] {
  const harassmentPatterns: PatternConfig[] = [
    { pattern: "hate speech", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "discrimination", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "bully", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "harass", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "intimidate", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "threaten", type: "harassment", severity: "high", confidence: 0.8 },
    { pattern: "stalk", type: "harassment", severity: "high", confidence: 0.85 },
    { pattern: "cyberbully", type: "harassment", severity: "high", confidence: 0.8 },
  ];
  
  return matchPatterns(message, harassmentPatterns);
}

/**
 * Check for spam patterns
 */
export function checkSpamPatterns(message: string): ModerationFlag[] {
  const spamPatterns: PatternConfig[] = [
    { pattern: "click here", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "free money", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "guaranteed", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "act now", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "limited time", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "winner", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "prize", type: "spam", severity: "low", confidence: 0.6 },
    { pattern: "congratulations", type: "spam", severity: "low", confidence: 0.5 },
  ];
  
  return matchPatterns(message, spamPatterns);
}

/**
 * Check for medical advice requests
 */
export function checkMedicalAdvicePatterns(message: string): ModerationFlag[] {
  const medicalPatterns: PatternConfig[] = [
    { pattern: "diagnose", type: "medical-advice", severity: "medium", confidence: 0.7 },
    { pattern: "prescription", type: "medical-advice", severity: "medium", confidence: 0.7 },
    { pattern: "medication", type: "medical-advice", severity: "medium", confidence: 0.7 },
    { pattern: "you should take", type: "medical-advice", severity: "medium", confidence: 0.7 },
    { pattern: "you need surgery", type: "medical-advice", severity: "high", confidence: 0.8 },
    { pattern: "medical treatment", type: "medical-advice", severity: "medium", confidence: 0.7 },
    { pattern: "diagnosis", type: "medical-advice", severity: "medium", confidence: 0.7 },
  ];
  
  return matchPatterns(message, medicalPatterns);
}

/**
 * Check for profanity (if enabled)
 */
export function checkProfanity(message: string, profanityWords: string[]): ModerationFlag[] {
  if (profanityWords.length === 0) {
    return [];
  }
  
  const lowerMessage = message.toLowerCase();
  const flags: ModerationFlag[] = [];
  
  for (const word of profanityWords) {
    if (lowerMessage.includes(word.toLowerCase())) {
      flags.push({
        type: "profanity",
        severity: "low",
        confidence: 0.9,
        reason: "Profanity detected",
      });
    }
  }
  
  return flags;
}

/**
 * Determine risk level from crisis result and moderation flags
 */
export function determineRiskLevelFromFlags(
  crisisRiskLevel: 'low' | 'medium' | 'high' | 'critical',
  moderationFlags: ModerationFlag[]
): 'low' | 'medium' | 'high' | 'critical' {
  // Crisis detection takes highest priority
  if (crisisRiskLevel === 'critical') return 'critical';
  if (crisisRiskLevel === 'high') return 'high';
  
  // Check for critical moderation flags
  const hasCriticalFlag = moderationFlags.some(
    f => f.severity === 'high' && (f.type === 'violence' || f.type === 'self-harm')
  );
  if (hasCriticalFlag) return 'critical';
  
  // Check for high severity flags
  const hasHighFlag = moderationFlags.some(f => f.severity === 'high');
  if (hasHighFlag) return 'high';
  
  // Check for medium severity flags
  const hasMediumFlag = moderationFlags.some(f => f.severity === 'medium');
  if (hasMediumFlag) return 'medium';
  
  // Medium crisis risk
  if (crisisRiskLevel === 'medium') return 'medium';
  
  return 'low';
}

/**
 * Determine if intervention is required
 */
export function requiresIntervention(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  moderationFlags: ModerationFlag[]
): boolean {
  if (riskLevel === 'critical' || riskLevel === 'high') {
    return true;
  }
  
  return moderationFlags.some(
    f => f.severity === 'high' || f.severity === 'medium'
  );
}

