import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const initialEmail = process.env.INITIAL_IT_EMAIL || "kiroloshaliem@gmail.com";
  const initialPassword = process.env.INITIAL_IT_PASSWORD || "AdminPassword123!";

  console.log(`Starting seed process...`);

  // Ensure initial IT User exists
  const existingUser = await prisma.user.findUnique({
    where: { email: initialEmail },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const itUser = await prisma.user.create({
      data: {
        email: initialEmail,
        passwordHash,
        role: Role.IT,
      },
    });
    console.log(`✅ Initial IT User created: ${itUser.email}`);
  } else {
    console.log(`ℹ️ Initial IT User already exists: ${existingUser.email}`);
  }

  console.log(`🎉 Seeding complete!`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
