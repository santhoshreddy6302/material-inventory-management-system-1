import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'CREATE DATABASE IF NOT EXISTS `material_inventory` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  );
  console.log('Database "material_inventory" is ready');
}

main()
  .catch((error: Error) => {
    console.error(`Database creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
