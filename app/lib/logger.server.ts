import pino from 'pino';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next?: any) => {
  const start = Date.now();
  
  req.logger = logger.child({
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  });

  req.logger.info('Request started');

  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info({
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    }, 'Request completed');
  });

  if (next) next();
};

// Authentication logging
export const authLogger = {
  loginAttempt: (email: string, success: boolean, ip?: string) => {
    logger.info({
      event: 'auth_login_attempt',
      email,
      success,
      ip,
    }, `Login attempt ${success ? 'successful' : 'failed'} for ${email}`);
  },

  userCreated: (userId: string, email: string, role: string) => {
    logger.info({
      event: 'auth_user_created',
      userId,
      email,
      role,
    }, `New user created: ${email} (${role})`);
  },

  sessionCreated: (userId: string, email: string) => {
    logger.info({
      event: 'auth_session_created',
      userId,
      email,
    }, `Session created for user: ${email}`);
  },

  sessionExpired: (userId: string) => {
    logger.info({
      event: 'auth_session_expired',
      userId,
    }, `Session expired for user: ${userId}`);
  },
};

// Database logging
export const dbLogger = {
  query: (operation: string, table: string, duration: number, success: boolean) => {
    logger.debug({
      event: 'db_query',
      operation,
      table,
      duration: `${duration}ms`,
      success,
    }, `DB ${operation} on ${table}`);
  },

  connection: (status: 'connected' | 'disconnected' | 'error', details?: string) => {
    logger.info({
      event: 'db_connection',
      status,
      details,
    }, `Database ${status}${details ? `: ${details}` : ''}`);
  },
};

// AI/Companion logging
export const aiLogger = {
  request: (companionId: string, userId: string, messageLength: number) => {
    logger.info({
      event: 'ai_request',
      companionId,
      userId,
      messageLength,
    }, `AI request from user ${userId} to companion ${companionId}`);
  },

  response: (companionId: string, userId: string, responseLength: number, duration: number) => {
    logger.info({
      event: 'ai_response',
      companionId,
      userId,
      responseLength,
      duration: `${duration}ms`,
    }, `AI response generated for user ${userId} in ${duration}ms`);
  },

  error: (companionId: string, userId: string, error: string) => {
    logger.error({
      event: 'ai_error',
      companionId,
      userId,
      error,
    }, `AI error for user ${userId}: ${error}`);
  },
};

// Security logging
export const securityLogger = {
  suspiciousActivity: (userId: string, activity: string, ip: string) => {
    logger.warn({
      event: 'security_suspicious_activity',
      userId,
      activity,
      ip,
    }, `Suspicious activity detected: ${activity}`);
  },

  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn({
      event: 'security_rate_limit_exceeded',
      ip,
      endpoint,
    }, `Rate limit exceeded for IP ${ip} on ${endpoint}`);
  },

  invalidToken: (token: string, ip: string) => {
    logger.warn({
      event: 'security_invalid_token',
      token: token.substring(0, 10) + '...', // Log only first 10 chars
      ip,
    }, `Invalid token attempt from IP ${ip}`);
  },
};

// Safety & moderation logging
export const safetyLogger = {
  safetyCheck: (userId: string, riskLevel: string, flags: number, ip?: string) => {
    logger.info({
      event: 'safety_check',
      userId,
      riskLevel,
      flags,
      ip,
    }, `Safety check for user ${userId}: ${riskLevel} risk with ${flags} flags`);
  },

  moderationFlag: (userId: string, flagType: string, severity: string, reason: string) => {
    logger.warn({
      event: 'moderation_flag',
      userId,
      flagType,
      severity,
      reason,
    }, `Moderation flag for user ${userId}: ${flagType} (${severity}) - ${reason}`);
  },

  interventionRequired: (userId: string, riskLevel: string, reason: string) => {
    logger.error({
      event: 'safety_intervention',
      userId,
      riskLevel,
      reason,
    }, `Safety intervention required for user ${userId}: ${riskLevel} risk - ${reason}`);
  },

  warn: (message: string, data?: any) => {
    logger.warn({
      event: 'safety_warning',
      ...data,
    }, message);
  },

  error: (message: string, data?: any) => {
    logger.error({
      event: 'safety_error',
      ...data,
    }, message);
  },
};

// Crisis detection logging
export const crisisLogger = {
  crisisDetected: (userId: string, riskLevel: string, keywords: string[], ip?: string) => {
    logger.warn({
      event: 'crisis_detected',
      userId,
      riskLevel,
      keywords,
      ip,
    }, `Crisis detected for user ${userId}: ${riskLevel} risk with keywords: ${keywords.join(', ')}`);
  },

  crisisResolved: (userId: string, crisisId: string, resolution: string) => {
    logger.info({
      event: 'crisis_resolved',
      userId,
      crisisId,
      resolution,
    }, `Crisis resolved for user ${userId}: ${resolution}`);
  },

  crisisEscalated: (userId: string, riskLevel: string, resources: string[]) => {
    logger.error({
      event: 'crisis_escalated',
      userId,
      riskLevel,
      resources,
    }, `Crisis escalated for user ${userId}: ${riskLevel} risk - resources provided: ${resources.join(', ')}`);
  },

  crisisResourcesProvided: (userId: string, resources: string[]) => {
    logger.info({
      event: 'crisis_resources_provided',
      userId,
      resources,
    }, `Crisis resources provided to user ${userId}: ${resources.join(', ')}`);
  },
};

// Performance logging
export const performanceLogger = {
  slowQuery: (operation: string, duration: number, threshold: number = PERFORMANCE_CONFIG.slowQueryThreshold) => {
    if (duration > threshold) {
      logger.warn({
        event: 'performance_slow_query',
        operation,
        duration,
        threshold,
      }, `Slow query detected: ${operation} took ${duration}ms`);
    }
  },

  memoryUsage: (usage: NodeJS.MemoryUsage) => {
    logger.info({
      event: 'performance_memory_usage',
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    }, 'Memory usage report');
  },
};

// Application lifecycle logging
export const appLogger = {
  startup: (port: number, env: string) => {
    logger.info({
      event: 'app_startup',
      port,
      env,
      nodeVersion: process.version,
    }, `PositiveNRG Remix app started on port ${port} in ${env} mode`);
  },

  shutdown: (signal: string) => {
    logger.info({
      event: 'app_shutdown',
      signal,
    }, `App shutting down due to ${signal}`);
  },

  error: (error: Error, context?: string) => {
    logger.error({
      event: 'app_error',
      error: error.message,
      stack: error.stack,
      context,
    }, `Application error${context ? ` in ${context}` : ''}: ${error.message}`);
  },
};

export default logger;
