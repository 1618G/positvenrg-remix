import { db } from "./db.server";

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  isActive: boolean;
}

export interface CompanionKnowledge {
  companionId: string;
  entries: KnowledgeEntry[];
}

// Knowledge base categories
export const KNOWLEDGE_CATEGORIES = {
  CALMFLOW: ['breathing', 'meditation', 'grounding', 'mindfulness', 'stress_relief'],
  GRACE: ['grief', 'loss', 'bereavement', 'memorial', 'coping', 'stages'],
  SPARK: ['productivity', 'goals', 'planning', 'motivation', 'accountability'],
  LUNA: ['sleep', 'insomnia', 'relaxation', 'bedtime', 'night_routine'],
  ECHO: ['listening', 'reflection', 'journaling', 'processing', 'validation'],
  POSITIVENRG: ['gratitude', 'positivity', 'energy', 'affirmations', 'optimism'],
  SUNNY: ['humor', 'laughter', 'lighthearted', 'mood_boost', 'joy']
};

export async function getCompanionKnowledge(companionId: string): Promise<KnowledgeEntry[]> {
  try {
    const knowledge = await db.companionKnowledge.findMany({
      where: {
        companionId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return knowledge.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords as string[],
      isActive: entry.isActive
    }));
  } catch (error) {
    console.error('Error fetching companion knowledge:', error);
    return [];
  }
}

export async function searchKnowledge(
  companionId: string,
  query: string,
  category?: string
): Promise<KnowledgeEntry[]> {
  try {
    const whereClause: any = {
      companionId,
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { keywords: { has: query } }
      ]
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    const knowledge = await db.companionKnowledge.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return knowledge.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords as string[],
      isActive: entry.isActive
    }));
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return [];
  }
}

export async function getContextualKnowledge(
  companionId: string,
  message: string,
  conversationContext?: any
): Promise<KnowledgeEntry[]> {
  const lowerMessage = message.toLowerCase();
  const relevantCategories: string[] = [];
  
  // Determine relevant categories based on message content
  if (lowerMessage.includes('breath') || lowerMessage.includes('calm') || lowerMessage.includes('stress')) {
    relevantCategories.push('breathing', 'meditation', 'grounding');
  }
  
  if (lowerMessage.includes('grief') || lowerMessage.includes('loss') || lowerMessage.includes('death')) {
    relevantCategories.push('grief', 'bereavement', 'coping');
  }
  
  if (lowerMessage.includes('goal') || lowerMessage.includes('plan') || lowerMessage.includes('motivate')) {
    relevantCategories.push('productivity', 'goals', 'planning');
  }
  
  if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
    relevantCategories.push('sleep', 'relaxation', 'bedtime');
  }
  
  if (lowerMessage.includes('listen') || lowerMessage.includes('reflect') || lowerMessage.includes('process')) {
    relevantCategories.push('listening', 'reflection', 'journaling');
  }
  
  if (lowerMessage.includes('gratitude') || lowerMessage.includes('positive') || lowerMessage.includes('energy')) {
    relevantCategories.push('gratitude', 'positivity', 'affirmations');
  }
  
  if (lowerMessage.includes('laugh') || lowerMessage.includes('humor') || lowerMessage.includes('smile')) {
    relevantCategories.push('humor', 'laughter', 'mood_boost');
  }
  
  // If no specific categories found, return general knowledge
  if (relevantCategories.length === 0) {
    return await getCompanionKnowledge(companionId);
  }
  
  // Search for knowledge in relevant categories
  const knowledgePromises = relevantCategories.map(category =>
    searchKnowledge(companionId, '', category)
  );
  
  const knowledgeResults = await Promise.all(knowledgePromises);
  const allKnowledge = knowledgeResults.flat();
  
  // Remove duplicates
  const uniqueKnowledge = allKnowledge.filter((entry, index, self) =>
    index === self.findIndex(e => e.id === entry.id)
  );
  
  return uniqueKnowledge;
}

export async function addKnowledgeEntry(
  companionId: string,
  title: string,
  content: string,
  category: string,
  keywords: string[] = []
): Promise<KnowledgeEntry> {
  try {
    const entry = await db.companionKnowledge.create({
      data: {
        companionId,
        title,
        content,
        category,
        keywords,
        isActive: true
      }
    });
    
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords as string[],
      isActive: entry.isActive
    };
  } catch (error) {
    console.error('Error adding knowledge entry:', error);
    throw error;
  }
}

export async function updateKnowledgeEntry(
  entryId: string,
  updates: Partial<{
    title: string;
    content: string;
    category: string;
    keywords: string[];
    isActive: boolean;
  }>
): Promise<KnowledgeEntry> {
  try {
    const entry = await db.companionKnowledge.update({
      where: { id: entryId },
      data: updates
    });
    
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords as string[],
      isActive: entry.isActive
    };
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    throw error;
  }
}

export async function deleteKnowledgeEntry(entryId: string): Promise<void> {
  try {
    await db.companionKnowledge.delete({
      where: { id: entryId }
    });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    throw error;
  }
}

// Helper function to get knowledge base statistics
export async function getKnowledgeStats(): Promise<{
  totalEntries: number;
  entriesByCompanion: Record<string, number>;
  entriesByCategory: Record<string, number>;
}> {
  try {
    const totalEntries = await db.companionKnowledge.count({
      where: { isActive: true }
    });
    
    const entriesByCompanion = await db.companionKnowledge.groupBy({
      by: ['companionId'],
      where: { isActive: true },
      _count: { id: true }
    });
    
    const entriesByCategory = await db.companionKnowledge.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true }
    });
    
    return {
      totalEntries,
      entriesByCompanion: entriesByCompanion.reduce((acc, item) => {
        acc[item.companionId] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      entriesByCategory: entriesByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Error getting knowledge stats:', error);
    return {
      totalEntries: 0,
      entriesByCompanion: {},
      entriesByCategory: {}
    };
  }
}
