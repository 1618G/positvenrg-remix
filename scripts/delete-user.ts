import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteUser() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: npx tsx scripts/delete-user.ts <email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.error(`❌ Cannot delete admin user: ${email}`);
      process.exit(1);
    }

    console.log(`🔄 Deleting user: ${email}...`);

    // Delete user (cascades will handle related records)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ User deleted successfully: ${email}`);
    console.log(`\n💡 You can now register with this email address`);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();

