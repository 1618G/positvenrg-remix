import { db } from "./db.server";
import { z } from "zod";
import type { OnboardingData } from "./types.server";

// Zod schema for onboarding data validation
export const onboardingSchema = z.object({
  // Personality & Communication
  communicationStyle: z.enum(["direct", "gentle", "encouraging", "listening"]),
  responseLength: z.enum(["brief", "moderate", "detailed"]),
  formality: z.enum(["casual", "professional", "friendly"]),
  
  // Needs & Goals
  primaryNeeds: z.array(z.string()).min(1, "Select at least one need"),
  goals: z.string().min(10, "Please describe your goals (at least 10 characters)"),
  
  // Triggers & Sensitivities
  triggers: z.array(z.string()).optional(),
  sensitivities: z.string().optional(),
  
  // Preferred Companions
  preferredCompanions: z.array(z.string()).optional(),
  
  // Lifestyle
  dailyRoutine: z.string().optional(),
  challenges: z.string().optional(),
  
  // Privacy & Preferences
  sharePersonalInfo: z.boolean().default(false),
  reminderPreferences: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(["daily", "weekly", "never"]).optional(),
  }).optional(),
  
  // Career Context (optional, for Jobe companion)
  careerContext: z.object({
    industry: z.string().optional(),
    jobTitle: z.string().optional(),
    experienceLevel: z.enum(["entry", "mid", "senior", "executive"]).optional(),
    currentSituation: z.string().optional(),
    careerGoals: z.string().optional(),
    location: z.string().optional(),
    targetLocations: z.array(z.string()).optional(),
    relocationOpen: z.boolean().optional(),
    visaConsiderations: z.boolean().optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export async function saveOnboardingData(
  userId: string,
  data: OnboardingData
): Promise<void> {
  try {
    // Validate data
    const validatedData = onboardingSchema.parse(data);
    
    // Update user with onboarding data
    await db.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingData: validatedData as OnboardingData,
      },
    });
    
    // Also update user preferences with relevant data
    const existingPrefs = await db.userPreference.findFirst({
      where: { userId },
    });
    
    const preferencesData = {
      preferences: {
        communicationStyle: validatedData.communicationStyle,
        responseLength: validatedData.responseLength,
        formality: validatedData.formality,
        sharePersonalInfo: validatedData.sharePersonalInfo,
        reminderPreferences: validatedData.reminderPreferences,
      },
      triggers: validatedData.triggers || [],
      goals: {
        primaryNeeds: validatedData.primaryNeeds,
        goals: validatedData.goals,
        challenges: validatedData.challenges,
        dailyRoutine: validatedData.dailyRoutine,
      },
    };
    
    if (existingPrefs) {
      await db.userPreference.update({
        where: { id: existingPrefs.id },
        data: preferencesData,
      });
    } else {
      await db.userPreference.create({
        data: {
          userId,
          ...preferencesData,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`);
    }
    throw error;
  }
}

export async function getOnboardingData(userId: string): Promise<OnboardingData | null> {
  validateOrThrow(userIdSchema, userId, "userId");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingData: true },
  });
  
  if (!user?.onboardingData) {
    return null;
  }
  
  return user.onboardingData as OnboardingData;
}

export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });
  
  return user?.onboardingCompleted ?? false;
}


