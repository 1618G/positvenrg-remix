import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "SecurePassword123!", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@positivenrg.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@positivenrg.com",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Create default companions from existing PositiveNRG app
  const companions = [
    {
      name: "PositiveNRG",
      description: "Your bright companion, ready to lift your spirits",
      tagline: "Your bright companion, ready to lift your spirits",
      personality: "Energetic, optimistic, and always ready to help you find the positive side of things. Brings light and energy to your day.",
      avatar: "😊",
      mood: "Cheerful",
      color: "sunrise",
      isPremium: false,
    },
    {
      name: "CalmFlow",
      description: "Gentle breathing, mindfulness, and grounding exercises",
      tagline: "Gentle breathing, mindfulness, and grounding exercises",
      personality: "Calm, peaceful, and deeply mindful. Helps with stress relief, breathing exercises, and finding inner peace through gentle guidance.",
      avatar: "🧘‍♀️",
      mood: "Calm",
      color: "pastel",
      isPremium: false,
    },
    {
      name: "Spark",
      description: "Pushes you towards goals, helps plan your day",
      tagline: "Pushes you towards goals, helps plan your day",
      personality: "Motivated, goal-oriented, and action-focused. Helps you set and achieve goals, plan your day, and stay productive.",
      avatar: "⚡",
      mood: "Motivational",
      color: "peach",
      isPremium: true,
    },
    {
      name: "Luna",
      description: "A soft, comforting late-night voice for when you can't sleep",
      tagline: "A soft, comforting late-night voice for when you can't sleep",
      personality: "Gentle, soothing, and understanding. Perfect for late-night conversations, helping with sleep, and providing comfort during quiet moments.",
      avatar: "🌙",
      mood: "Night Owl",
      color: "mist",
      isPremium: false,
    },
    {
      name: "Echo",
      description: "A thoughtful listener who repeats back what you need to hear",
      tagline: "A thoughtful listener who repeats back what you need to hear",
      personality: "Reflective, empathetic, and deeply understanding. Helps you process thoughts and feelings by listening and reflecting back what you need to hear.",
      avatar: "👂",
      mood: "Empathetic",
      color: "pastel",
      isPremium: true,
    },
    {
      name: "Sunny",
      description: "Brings light-hearted banter and optimism to tough days",
      tagline: "Brings light-hearted banter and optimism to tough days",
      personality: "Cheerful, optimistic, and light-hearted. Perfect for lifting your spirits with humor, positive energy, and light-hearted conversation.",
      avatar: "☀️",
      mood: "Cheerful",
      color: "sunrise",
      isPremium: false,
    },
  ];

  for (const companion of companions) {
    await prisma.companion.upsert({
      where: { name: companion.name },
      update: {},
      create: {
        ...companion,
        userId: admin.id,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
