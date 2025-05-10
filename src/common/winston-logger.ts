import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

// Define custom log levels (similar to Log4j)
const customLogLevels = {
  levels: {
    error: 0,   // Critical errors
    warn: 1,    // Warnings
    info: 2,    // Standard logging
    http: 3,    // HTTP request logs
    debug: 4,   // Debugging logs
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Apply custom colors to Winston
winston.addColors(customLogLevels.colors);

export const winstonLogger = winston.createLogger({
  levels: customLogLevels.levels, // Use custom levels
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Auto-adjust level

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),

  transports: [
    // ✅ Console Transport (Colored Logs)
    new winston.transports.Console({
      level: 'debug', // Show all logs in console
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ all: true }), // Apply colors
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    }),

    // ✅ Error Logs File
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),

    // ✅ Warning Logs File
    new winston.transports.File({ filename: 'logs/warn.log', level: 'warn' }),

    // ✅ HTTP Logs File
    new winston.transports.File({ filename: 'logs/http.log', level: 'http' }),

    // ✅ General Logs File (Info + Debug)
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
