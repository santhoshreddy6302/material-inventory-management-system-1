import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const result = await prisma.$queryRaw<Array<{ version: string }>>`
    SELECT VERSION() AS version
  `;

  console.log(`Database connection successful (${result[0]?.version ?? 'TiDB/MySQL'})`);
}

main()
  .catch((error: Error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
