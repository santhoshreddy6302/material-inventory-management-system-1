import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route not found: ${req.originalUrl}`) as AppError;
  err.statusCode = 404;
  next(err);
};

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Translate database error codes (Prisma specific errors)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Duplicate entry. A record with this unique identifier already exists.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint violation. Referenced record does not exist or is in use.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found in the database.';
  }

  logger.error(`[${statusCode}] ${message} - ${req.method} ${req.originalUrl}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};
