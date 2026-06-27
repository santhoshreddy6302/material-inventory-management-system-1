import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma Client (MySQL/TiDB)');
  } catch (error) {
    logger.error('MySQL/TiDB database connection failed', error);
    throw error;
  }
}

export default prisma;
export { prisma };
