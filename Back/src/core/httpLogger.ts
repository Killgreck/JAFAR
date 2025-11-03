import pino from 'pino';
import pinoHttp from 'pino-http';

/**
 * Pino logger instance.
 */
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

/**
 * Pino HTTP logger middleware.
 */
export const httpLogger = pinoHttp({
  logger,
});
