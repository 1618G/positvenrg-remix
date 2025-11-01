import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log("🔄 Clearing all users except admins...");

    // Count admin users first
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    console.log(`📊 Found ${adminCount} admin user(s)`);

    // Delete all non-admin users and their related data
    const result = await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN",
        },
      },
    });

    console.log(`✅ Deleted ${result.count} non-admin user(s)`);
    console.log(`👤 Admin users preserved: ${adminCount}`);

    // Count remaining users
    const remainingCount = await prisma.user.count();
    console.log(`📊 Total users remaining: ${remainingCount}`);
    
    // List admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("\n👑 Admin users:");
    admins.forEach((admin) => {
      console.log(`  - ${admin.email} (${admin.name || "No name"})`);
    });

    console.log("\n✅ User cleanup complete!");
  } catch (error) {
    console.error("❌ Error clearing users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();

