import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findUserByEmail() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: npx tsx scripts/find-user-by-email.ts <email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      console.log(`✅ Email "${email}" is not in use - available for registration`);
      return;
    }

    console.log(`\n📧 Found user with email: ${email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name || "Not set"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    
    if (user.subscription) {
      console.log(`   Subscription: ${user.subscription.planType}`);
    }

    console.log(`\n💡 Options:`);
    console.log(`   1. Delete this user: npx tsx scripts/delete-user.ts ${email}`);
    console.log(`   2. Use a different email address`);
    console.log(`   3. Sign in with this email instead`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findUserByEmail();

