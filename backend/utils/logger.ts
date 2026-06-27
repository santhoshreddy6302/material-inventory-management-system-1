import winston from 'winston';
import path from 'path';
import fs from 'fs';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const colors = { error: 'red', warn: 'yellow', info: 'green', debug: 'blue' };
winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const logger = winston.createLogger({
  levels,
  format,
  transports: [
    new winston.transports.Console({ format }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    })
  ]
});

// Create logs directory if not exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

export default logger;
export { logger };
