// Logger utility with structured logging and color-coded output

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colors.gray,
  [LogLevel.INFO]: colors.cyan,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
};

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Format timestamp to ISO string
function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

// Truncate string for logging (to avoid huge log lines)
function truncate(str: string, maxLength: number = 100): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Sanitize sensitive data from objects
function sanitizeObject(obj: any, sensitiveKeys: string[] = ['apiKey', 'password', 'token', 'secret']): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveKeys);
    } else if (typeof value === 'string') {
      sanitized[key] = truncate(value, 200);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Main logger function
interface LogOptions {
  requestId?: string;
  operation?: string;
  duration?: number;
  details?: any;
}

function log(level: LogLevel, message: string, options: LogOptions = {}): void {
  const { requestId, operation, duration, details } = options;
  
  const timestamp = formatTimestamp();
  const levelStr = levelColors[level] + level.padEnd(5) + colors.reset;
  const requestIdStr = requestId ? `${colors.gray}[req:${requestId}]${colors.reset} ` : '';
  const operationStr = operation ? `${colors.blue}${operation}${colors.reset} - ` : '';
  const durationStr = duration !== undefined ? ` ${colors.green}${duration}ms${colors.reset}` : '';
  
  let detailsStr = '';
  if (details !== undefined) {
    try {
      const sanitized = sanitizeObject(details);
      detailsStr = ` ${JSON.stringify(sanitized)}`;
    } catch {
      detailsStr = ` [Details serialization failed]`;
    }
  }
  
  console.log(`${timestamp} ${levelStr} ${requestIdStr}${operationStr}${message}${durationStr}${detailsStr}`);
}

// Logger API
export const logger = {
  debug(message: string, options?: LogOptions): void {
    log(LogLevel.DEBUG, message, options);
  },
  
  info(message: string, options?: LogOptions): void {
    log(LogLevel.INFO, message, options);
  },
  
  warn(message: string, options?: LogOptions): void {
    log(LogLevel.WARN, message, options);
  },
  
  error(message: string, options?: LogOptions & { error?: Error; stack?: string }): void {
    const { error, stack, ...restOptions } = options || {};
    let errorDetails = restOptions.details;
    
    if (error) {
      errorDetails = {
        ...errorDetails,
        message: error.message,
        name: error.name,
        stack: stack ? truncate(stack, 500) : undefined,
      };
    }
    
    log(LogLevel.ERROR, message, { ...restOptions, details: errorDetails });
  },
  
  // Generate a new request ID
  generateRequestId,
  
  // Helper for HTTP request logging
  logRequest(req: { method: string; path: string; query?: any; body?: any }, requestId: string, options?: { skipBody?: boolean }): void {
    const queryStr = req.query && Object.keys(req.query).length > 0 
      ? `?${JSON.stringify(req.query)}` 
      : '';
    
    let bodySummary: any = undefined;
    if (req.body && Object.keys(req.body).length > 0 && !options?.skipBody) {
      bodySummary = sanitizeObject(req.body);
    }
    
    logger.info(`${req.method} ${req.path}${queryStr} - Request received`, {
      requestId,
      details: bodySummary,
    });
  },
  
  // Helper for HTTP response logging
  logResponse(
    req: { method: string; path: string },
    res: { statusCode: number },
    duration: number,
    requestId: string,
    extraDetails?: any
  ): void {
    const statusColor = res.statusCode >= 400 ? colors.red : colors.green;
    const statusStr = `${statusColor}${res.statusCode}${colors.reset}`;
    
    logger.info(`${req.method} ${req.path} - ${statusStr} in ${duration}ms`, {
      requestId,
      details: extraDetails,
    });
  },
};

export default logger;