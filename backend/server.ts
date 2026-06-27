import 'dotenv/config';
import app from './app';
import prisma, { connectDatabase } from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Base: http://localhost:${PORT}/api`);
  });

  const shutdown = () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Promise Rejection: ' + err.message);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  });
}

startServer().catch((err: Error) => {
  logger.error('Server startup failed: ' + err.message);
  process.exit(1);
});
