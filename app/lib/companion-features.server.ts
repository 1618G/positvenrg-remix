import { db } from "./db.server";

export interface CompanionFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  data: any;
  isActive: boolean;
}

// CalmFlow Features
export const CALMFLOW_FEATURES = {
  breathingExercise: {
    name: "Guided Breathing Exercise",
    description: "4-7-8 breathing technique with visual guidance",
    category: "breathing",
    data: {
      technique: "4-7-8",
      instructions: [
        "Breathe in through your nose for 4 counts",
        "Hold your breath for 7 counts", 
        "Exhale through your mouth for 8 counts",
        "Repeat 4 times"
      ],
      duration: 120 // seconds
    }
  },
  grounding54321: {
    name: "5-4-3-2-1 Grounding Exercise",
    description: "Sensory grounding technique for anxiety",
    category: "grounding",
    data: {
      steps: [
        "Name 5 things you can see",
        "Name 4 things you can touch",
        "Name 3 things you can hear",
        "Name 2 things you can smell",
        "Name 1 thing you can taste"
      ]
    }
  },
  progressiveRelaxation: {
    name: "Progressive Muscle Relaxation",
    description: "Tension and release technique for relaxation",
    category: "relaxation",
    data: {
      muscleGroups: [
        "Forehead and scalp",
        "Eyes and face",
        "Neck and shoulders",
        "Arms and hands",
        "Chest and back",
        "Abdomen",
        "Legs and feet"
      ],
      duration: 300 // seconds
    }
  }
};

// Grace Features
export const GRACE_FEATURES = {
  griefStageIdentifier: {
    name: "Grief Stage Identifier",
    description: "Help identify current stage of grief",
    category: "grief_support",
    data: {
      stages: [
        "Denial - Initial shock and disbelief",
        "Anger - Frustration and rage",
        "Bargaining - 'What if' scenarios",
        "Depression - Deep sadness and withdrawal",
        "Acceptance - Coming to terms with loss"
      ],
      questions: [
        "How are you feeling about the loss right now?",
        "Are you finding it hard to believe it happened?",
        "Do you feel angry about the situation?",
        "Are you thinking about what you could have done differently?"
      ]
    }
  },
  memorialIdeas: {
    name: "Memorial Ideas Generator",
    description: "Suggest meaningful ways to honor a loved one",
    category: "memorial",
    data: {
      ideas: [
        "Create a memory box with photos and mementos",
        "Plant a tree or garden in their memory",
        "Write letters to them",
        "Create a photo album or scrapbook",
        "Donate to a cause they cared about",
        "Light a candle on special dates",
        "Share stories about them with others"
      ]
    }
  },
  copingStrategies: {
    name: "Grief Coping Strategies",
    description: "Evidence-based coping strategies for grief",
    category: "coping",
    data: {
      strategies: [
        "Allow yourself to feel all emotions",
        "Maintain routines and structure",
        "Connect with supportive people",
        "Express your feelings through writing or art",
        "Take care of your physical health",
        "Seek professional help if needed",
        "Be patient with yourself"
      ]
    }
  }
};

// Spark Features
export const SPARK_FEATURES = {
  smartGoalCreator: {
    name: "SMART Goal Creator",
    description: "Help create Specific, Measurable, Achievable, Relevant, Time-bound goals",
    category: "goal_setting",
    data: {
      criteria: {
        Specific: "What exactly do you want to achieve?",
        Measurable: "How will you know when you've achieved it?",
        Achievable: "Is this goal realistic for you?",
        Relevant: "Why is this goal important to you?",
        Time_bound: "When do you want to achieve this by?"
      }
    }
  },
  actionPlanGenerator: {
    name: "Action Plan Generator",
    description: "Break down goals into actionable steps",
    category: "planning",
    data: {
      steps: [
        "Define the main goal",
        "Break into smaller milestones",
        "Set deadlines for each milestone",
        "Identify required resources",
        "Plan for potential obstacles",
        "Create accountability measures"
      ]
    }
  },
  progressTracker: {
    name: "Progress Tracker",
    description: "Track and celebrate progress toward goals",
    category: "tracking",
    data: {
      metrics: [
        "Percentage completed",
        "Days remaining",
        "Milestones achieved",
        "Challenges overcome",
        "Lessons learned"
      ]
    }
  }
};

// Luna Features
export const LUNA_FEATURES = {
  sleepDiary: {
    name: "Sleep Diary",
    description: "Track sleep patterns and quality",
    category: "sleep_tracking",
    data: {
      fields: [
        "Bedtime",
        "Wake time",
        "Sleep quality (1-10)",
        "Dreams or nightmares",
        "Factors affecting sleep",
        "Energy level in morning"
      ]
    }
  },
  bedtimeRoutine: {
    name: "Bedtime Routine Builder",
    description: "Create personalized bedtime routines",
    category: "routine",
    data: {
      activities: [
        "Dim lights 1 hour before bed",
        "Avoid screens 30 minutes before bed",
        "Gentle stretching or yoga",
        "Reading a book",
        "Meditation or deep breathing",
        "Warm bath or shower",
        "Journaling or reflection"
      ]
    }
  },
  relaxationScripts: {
    name: "Relaxation Audio Scripts",
    description: "Guided relaxation for better sleep",
    category: "relaxation",
    data: {
      scripts: [
        "Body scan relaxation",
        "Progressive muscle relaxation",
        "Visualization for sleep",
        "Breathing exercises",
        "Mindfulness meditation"
      ]
    }
  }
};

// Echo Features
export const ECHO_FEATURES = {
  reflectionPrompts: {
    name: "Reflection Prompt Generator",
    description: "Thoughtful questions for self-reflection",
    category: "reflection",
    data: {
      categories: {
        daily: [
          "What am I grateful for today?",
          "What challenged me today?",
          "What did I learn about myself?"
        ],
        emotional: [
          "What emotions am I feeling right now?",
          "What triggered these emotions?",
          "How can I process these feelings?"
        ],
        growth: [
          "What would I tell my younger self?",
          "What am I proud of accomplishing?",
          "What do I want to improve about myself?"
        ]
      }
    }
  },
  journalingTemplates: {
    name: "Journaling Templates",
    description: "Structured templates for different types of journaling",
    category: "journaling",
    data: {
      templates: [
        "Daily reflection template",
        "Emotion processing template",
        "Goal setting template",
        "Gratitude journal template",
        "Problem-solving template"
      ]
    }
  },
  emotionWheel: {
    name: "Emotion Wheel Navigator",
    description: "Help identify and explore emotions",
    category: "emotion_identification",
    data: {
      primaryEmotions: ["Happy", "Sad", "Angry", "Fearful", "Surprised", "Disgusted"],
      secondaryEmotions: {
        Happy: ["Joyful", "Content", "Excited", "Proud", "Grateful"],
        Sad: ["Lonely", "Grief", "Disappointed", "Hopeless", "Melancholy"],
        Angry: ["Frustrated", "Irritated", "Furious", "Resentful", "Indignant"],
        Fearful: ["Anxious", "Worried", "Terrified", "Nervous", "Panicked"]
      }
    }
  }
};

// PositiveNRG & Sunny Features
export const POSITIVE_FEATURES = {
  gratitudeJournal: {
    name: "Gratitude Journal Prompts",
    description: "Daily prompts for gratitude practice",
    category: "gratitude",
    data: {
      prompts: [
        "What made you smile today?",
        "Who are you grateful for in your life?",
        "What small thing brought you joy?",
        "What challenge helped you grow?",
        "What beauty did you notice today?"
      ]
    }
  },
  affirmationGenerator: {
    name: "Daily Affirmation Generator",
    description: "Personalized positive affirmations",
    category: "affirmations",
    data: {
      categories: {
        self_worth: [
          "I am worthy of love and happiness",
          "I deserve to be treated with respect",
          "I am enough just as I am"
        ],
        strength: [
          "I am stronger than I think",
          "I can handle whatever comes my way",
          "I have overcome challenges before"
        ],
        growth: [
          "I am constantly growing and learning",
          "Every day I become a better version of myself",
          "I embrace new opportunities for growth"
        ]
      }
    }
  },
  moodBooster: {
    name: "Mood Booster Activities",
    description: "Quick activities to lift your spirits",
    category: "mood_boost",
    data: {
      activities: [
        "Listen to your favorite song",
        "Dance for 2 minutes",
        "Call a friend or family member",
        "Look at photos of happy memories",
        "Do 10 jumping jacks",
        "Write down 3 things you're grateful for",
        "Take 5 deep breaths",
        "Watch a funny video"
      ]
    }
  }
};

export async function getCompanionFeatures(companionId: string): Promise<CompanionFeature[]> {
  try {
    const companion = await db.companion.findUnique({
      where: { id: companionId }
    });
    
    if (!companion) {
      return [];
    }
    
    const companionName = companion.name;
    let features: any = {};
    
    switch (companionName) {
      case 'CalmFlow':
        features = CALMFLOW_FEATURES;
        break;
      case 'Grace':
        features = GRACE_FEATURES;
        break;
      case 'Spark':
        features = SPARK_FEATURES;
        break;
      case 'Luna':
        features = LUNA_FEATURES;
        break;
      case 'Echo':
        features = ECHO_FEATURES;
        break;
      case 'PositiveNRG':
      case 'Sunny':
        features = POSITIVE_FEATURES;
        break;
      default:
        return [];
    }
    
    return Object.entries(features).map(([key, feature]) => ({
      id: key,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      data: feature.data,
      isActive: true
    }));
  } catch (error) {
    console.error('Error getting companion features:', error);
    return [];
  }
}

export async function executeCompanionFeature(
  companionId: string,
  featureId: string,
  userInput?: any
): Promise<any> {
  try {
    const features = await getCompanionFeatures(companionId);
    const feature = features.find(f => f.id === featureId);
    
    if (!feature) {
      throw new Error('Feature not found');
    }
    
    // Execute feature-specific logic
    switch (featureId) {
      case 'breathingExercise':
        return executeBreathingExercise(feature.data, userInput);
      case 'grounding54321':
        return executeGrounding54321(feature.data, userInput);
      case 'smartGoalCreator':
        return executeSmartGoalCreator(feature.data, userInput);
      case 'griefStageIdentifier':
        return executeGriefStageIdentifier(feature.data, userInput);
      case 'sleepDiary':
        return executeSleepDiary(feature.data, userInput);
      case 'reflectionPrompts':
        return executeReflectionPrompts(feature.data, userInput);
      case 'gratitudeJournal':
        return executeGratitudeJournal(feature.data, userInput);
      default:
        return feature.data;
    }
  } catch (error) {
    console.error('Error executing companion feature:', error);
    throw error;
  }
}

// Feature execution functions
function executeBreathingExercise(data: any, userInput?: any) {
  return {
    type: 'breathing_exercise',
    technique: data.technique,
    instructions: data.instructions,
    duration: data.duration,
    currentStep: 0,
    isActive: true
  };
}

function executeGrounding54321(data: any, userInput?: any) {
  return {
    type: 'grounding_exercise',
    steps: data.steps,
    currentStep: 0,
    isActive: true
  };
}

function executeSmartGoalCreator(data: any, userInput?: any) {
  return {
    type: 'smart_goal_creator',
    criteria: data.criteria,
    currentStep: 'Specific',
    isActive: true
  };
}

function executeGriefStageIdentifier(data: any, userInput?: any) {
  return {
    type: 'grief_stage_identifier',
    stages: data.stages,
    questions: data.questions,
    currentQuestion: 0,
    isActive: true
  };
}

function executeSleepDiary(data: any, userInput?: any) {
  return {
    type: 'sleep_diary',
    fields: data.fields,
    entries: [],
    isActive: true
  };
}

function executeReflectionPrompts(data: any, userInput?: any) {
  const categories = Object.keys(data.categories);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const prompts = data.categories[randomCategory];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  
  return {
    type: 'reflection_prompt',
    category: randomCategory,
    prompt: randomPrompt,
    isActive: true
  };
}

function executeGratitudeJournal(data: any, userInput?: any) {
  const randomPrompt = data.prompts[Math.floor(Math.random() * data.prompts.length)];
  
  return {
    type: 'gratitude_journal',
    prompt: randomPrompt,
    isActive: true
  };
}

export async function getFeatureStats(): Promise<{
  totalFeatures: number;
  featuresByCompanion: Record<string, number>;
  featuresByCategory: Record<string, number>;
}> {
  const allFeatures = [
    ...Object.keys(CALMFLOW_FEATURES),
    ...Object.keys(GRACE_FEATURES),
    ...Object.keys(SPARK_FEATURES),
    ...Object.keys(LUNA_FEATURES),
    ...Object.keys(ECHO_FEATURES),
    ...Object.keys(POSITIVE_FEATURES)
  ];
  
  return {
    totalFeatures: allFeatures.length,
    featuresByCompanion: {
      'CalmFlow': Object.keys(CALMFLOW_FEATURES).length,
      'Grace': Object.keys(GRACE_FEATURES).length,
      'Spark': Object.keys(SPARK_FEATURES).length,
      'Luna': Object.keys(LUNA_FEATURES).length,
      'Echo': Object.keys(ECHO_FEATURES).length,
      'PositiveNRG': Object.keys(POSITIVE_FEATURES).length,
      'Sunny': Object.keys(POSITIVE_FEATURES).length
    },
    featuresByCategory: {
      'breathing': 1,
      'grounding': 1,
      'relaxation': 2,
      'grief_support': 1,
      'memorial': 1,
      'coping': 1,
      'goal_setting': 1,
      'planning': 1,
      'tracking': 1,
      'sleep_tracking': 1,
      'routine': 1,
      'reflection': 1,
      'journaling': 1,
      'emotion_identification': 1,
      'gratitude': 1,
      'affirmations': 1,
      'mood_boost': 1
    }
  };
}
