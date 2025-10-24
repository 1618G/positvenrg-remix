import { db } from "./db.server";
import { crisisLogger } from "./logger.server";

export interface CrisisDetectionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  sentiment: string;
  resources: string[];
  shouldEscalate: boolean;
}

export interface CrisisResources {
  emergency: {
    uk: string[];
    us: string[];
    international: string[];
  };
  textSupport: {
    uk: string[];
    us: string[];
  };
  specialized: {
    grief: string[];
    abuse: string[];
    addiction: string[];
    lgbtq: string[];
  };
}

// Crisis keywords by severity level
const CRISIS_KEYWORDS = {
  critical: [
    'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
    'want to die', 'end my life', 'suicidal', 'jump off', 'overdose', 'hang myself'
  ],
  high: [
    'self harm', 'cut myself', 'hurt myself', 'self injury', 'burn myself',
    'hit myself', 'punish myself', 'deserve pain', 'worthless', 'hopeless'
  ],
  medium: [
    'depressed', 'anxiety', 'panic', 'overwhelmed', 'can\'t cope', 'breaking down',
    'losing control', 'scared', 'terrified', 'alone', 'isolated', 'no one cares'
  ],
  low: [
    'sad', 'down', 'stressed', 'worried', 'concerned', 'struggling', 'difficult',
    'hard time', 'challenging', 'tough', 'rough day'
  ]
};

// Crisis resources by region
const CRISIS_RESOURCES: CrisisResources = {
  emergency: {
    uk: ['999 (Emergency Services)', '116 123 (Samaritans - 24/7)'],
    us: ['911 (Emergency Services)', '988 (Suicide & Crisis Lifeline)'],
    international: ['+44 116 123 (Samaritans)', '+1 800 273 8255 (US Crisis Line)']
  },
  textSupport: {
    uk: ['85258 (Shout - Text Support)', '116 123 (Samaritans)'],
    us: ['741741 (Crisis Text Line)', '988 (Suicide & Crisis Lifeline)']
  },
  specialized: {
    grief: [
      'Cruse Bereavement Care: 0808 808 1677',
      'GriefShare: griefshare.org',
      'Compassionate Friends: 0345 123 2304'
    ],
    abuse: [
      'National Domestic Abuse Helpline: 0808 2000 247',
      'Refuge: 0808 2000 247',
      'Women\'s Aid: 0808 2000 247'
    ],
    addiction: [
      'Alcoholics Anonymous: 0800 9177 650',
      'Narcotics Anonymous: 0300 999 1212',
      'SMART Recovery: smartrecovery.org.uk'
    ],
    lgbtq: [
      'Switchboard LGBT+ Helpline: 0800 0119 100',
      'LGBT Foundation: 0345 3 30 30 30',
      'Mermaids: 0808 801 0400'
    ]
  }
};

export async function detectCrisis(
  message: string,
  userId: string,
  chatId?: string,
  messageId?: string
): Promise<CrisisDetectionResult> {
  const lowerMessage = message.toLowerCase();
  
  // Detect crisis keywords
  const detectedKeywords: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check for critical keywords first
  for (const keyword of CRISIS_KEYWORDS.critical) {
    if (lowerMessage.includes(keyword)) {
      detectedKeywords.push(keyword);
      riskLevel = 'critical';
    }
  }
  
  // Check for high-risk keywords if not critical
  if (riskLevel !== 'critical') {
    for (const keyword of CRISIS_KEYWORDS.high) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        riskLevel = 'high';
      }
    }
  }
  
  // Check for medium-risk keywords if not high or critical
  if (riskLevel !== 'critical' && riskLevel !== 'high') {
    for (const keyword of CRISIS_KEYWORDS.medium) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        riskLevel = 'medium';
      }
    }
  }
  
  // Check for low-risk keywords if no higher risk detected
  if (riskLevel === 'low') {
    for (const keyword of CRISIS_KEYWORDS.low) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    }
  }
  
  // Perform sentiment analysis (simplified)
  const sentiment = analyzeSentiment(message);
  
  // Determine resources based on risk level and keywords
  const resources = getCrisisResources(riskLevel, detectedKeywords);
  
  // Determine if escalation is needed
  const shouldEscalate = riskLevel === 'critical' || riskLevel === 'high';
  
  // Log crisis detection
  if (detectedKeywords.length > 0) {
    await logCrisisDetection({
      userId,
      chatId,
      messageId,
      riskLevel,
      keywords: detectedKeywords,
      sentiment,
      resources,
      message
    });
  }
  
  return {
    riskLevel,
    keywords: detectedKeywords,
    sentiment,
    resources,
    shouldEscalate
  };
}

function analyzeSentiment(message: string): string {
  const positiveWords = ['good', 'great', 'happy', 'better', 'improving', 'hopeful', 'positive'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hopeless', 'despair'];
  
  const lowerMessage = message.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
}

function getCrisisResources(riskLevel: string, keywords: string[]): string[] {
  const resources: string[] = [];
  
  // Add emergency resources for high/critical risk
  if (riskLevel === 'critical' || riskLevel === 'high') {
    resources.push(...CRISIS_RESOURCES.emergency.uk);
    resources.push(...CRISIS_RESOURCES.textSupport.uk);
  }
  
  // Add specialized resources based on keywords
  if (keywords.some(k => ['grief', 'loss', 'death', 'died'].includes(k))) {
    resources.push(...CRISIS_RESOURCES.specialized.grief);
  }
  
  if (keywords.some(k => ['abuse', 'violence', 'hurt', 'hit'].includes(k))) {
    resources.push(...CRISIS_RESOURCES.specialized.abuse);
  }
  
  if (keywords.some(k => ['drink', 'alcohol', 'drug', 'addiction'].includes(k))) {
    resources.push(...CRISIS_RESOURCES.specialized.addiction);
  }
  
  return resources;
}

async function logCrisisDetection(data: {
  userId: string;
  chatId?: string;
  messageId?: string;
  riskLevel: string;
  keywords: string[];
  sentiment: string;
  resources: string[];
  message: string;
}) {
  try {
    await db.crisisLog.create({
      data: {
        userId: data.userId,
        chatId: data.chatId,
        messageId: data.messageId,
        riskLevel: data.riskLevel,
        keywords: data.keywords,
        sentiment: data.sentiment,
        resources: data.resources,
        resolved: false
      }
    });
    
    crisisLogger.warn('Crisis detected', {
      userId: data.userId,
      riskLevel: data.riskLevel,
      keywords: data.keywords,
      shouldEscalate: data.riskLevel === 'critical' || data.riskLevel === 'high'
    });
  } catch (error) {
    crisisLogger.error('Failed to log crisis detection', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export function generateCrisisResponse(crisisResult: CrisisDetectionResult): string {
  if (crisisResult.riskLevel === 'critical') {
    return `I'm deeply concerned about what you're sharing. Your safety is the most important thing right now.

**Please reach out for immediate support:**
${crisisResult.resources.map(resource => `• ${resource}`).join('\n')}

You don't have to face this alone. There are people who care and want to help you through this difficult time. Please consider reaching out to one of these resources right now.

I'm here to listen and support you, but your safety comes first.`;
  }
  
  if (crisisResult.riskLevel === 'high') {
    return `I can hear that you're going through an incredibly difficult time. Your wellbeing matters, and you deserve support.

**Here are some resources that can help:**
${crisisResult.resources.map(resource => `• ${resource}`).join('\n')}

It's okay to reach out for help. These services are there specifically to support people in situations like yours. You don't have to carry this burden alone.

I'm here to listen and support you through this.`;
  }
  
  if (crisisResult.riskLevel === 'medium') {
    return `I can sense that you're struggling right now. It takes courage to share these feelings, and I want you to know that support is available.

**If you need someone to talk to:**
${crisisResult.resources.slice(0, 2).map(resource => `• ${resource}`).join('\n')}

Remember, it's okay to not be okay. These feelings are valid, and reaching out for support is a sign of strength, not weakness.

I'm here to listen and support you.`;
  }
  
  return `I hear that you're going through a tough time. It's completely normal to feel this way, and you're not alone in this.

**If you need additional support:**
• Samaritans: 116 123 (24/7, free)
• Shout: Text 85258 (24/7, free)

I'm here to listen and support you through this.`;
}

export async function getCrisisStats(): Promise<{
  totalCrises: number;
  criticalCrises: number;
  resolvedCrises: number;
  recentCrises: any[];
}> {
  const totalCrises = await db.crisisLog.count();
  const criticalCrises = await db.crisisLog.count({
    where: { riskLevel: 'critical' }
  });
  const resolvedCrises = await db.crisisLog.count({
    where: { resolved: true }
  });
  const recentCrises = await db.crisisLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      }
    }
  });
  
  return {
    totalCrises,
    criticalCrises,
    resolvedCrises,
    recentCrises
  };
}
