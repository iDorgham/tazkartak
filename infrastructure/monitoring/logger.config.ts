import winston from 'winston';
import path from 'path';

// Free tier logging configuration - no external services needed
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console logging for development and Railway logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File logging for production (optional)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
});

// Optional: Add Logtail for paid tier
if (process.env.LOGTAIL_SOURCE_TOKEN) {
  try {
    const { Logtail } = require('@logtail/node');
    const { LogtailTransport } = require('@logtail/winston');
    const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
    logger.add(new LogtailTransport(logtail));
  } catch (error) {
    logger.warn('Logtail not available, using free tier logging');
  }
}
