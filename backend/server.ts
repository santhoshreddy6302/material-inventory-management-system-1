import app from './app';
import logger from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 API Base: http://localhost:${PORT}/api`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('❌ Unhandled Promise Rejection: ' + err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: Error) => {
  logger.error('❌ Uncaught Exception: ' + err.message);
  process.exit(1);
});

export default server;
