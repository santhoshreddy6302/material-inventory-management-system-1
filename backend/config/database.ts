import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Verify connection
prisma.$connect()
  .then(() => {
    logger.info('✅ PostgreSQL Database connected successfully via Prisma Client');
  })
  .catch((err) => {
    logger.error('❌ PostgreSQL connection failed:', err);
  });

export default prisma;
export { prisma };
