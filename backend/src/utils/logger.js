/**
 * Error logging utility with sanitization to prevent information disclosure
 */

// Sensitive patterns to redact from error messages
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /private[_-]?key/i,
  /session/i,
  /cookie/i,
  /jwt/i,
  /encryption[_-]?key/i,
  /redis/i,
  /database/i,
  /connection/i,
  /@[\w.-]+/g, // Email addresses
  /\b\d{10,}\b/g, // Potential phone numbers or IDs
  /\b[A-Za-z0-9]{32,}\b/g, // Potential API keys or tokens
];

/**
 * Sanitize error message by removing sensitive information
 * @param {Error|string} error - Error object or message
 * @returns {string} Sanitized error message
 */
function sanitizeError(error) {
  if (!error) return 'Unknown error';
  
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }
  
  // Redact sensitive information
  let sanitized = errorMessage;
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  // Limit error message length to prevent log flooding
  const maxLength = 500;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

/**
 * Sanitize any object by removing sensitive fields
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'password', 'secret', 'token', 'apiKey', 'api_key', 'authorization',
    'bearer', 'credential', 'privateKey', 'private_key', 'session',
    'cookie', 'jwt', 'encryptionKey', 'encryption_key', 'redis',
    'database', 'connection', 'email', 'phone', 'phoneNumber'
  ];
  
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * Log error with sanitized message
 * @param {string} context - Context where error occurred
 * @param {Error|string} error - Error object or message
 * @param {Object} metadata - Additional metadata to log
 */
function logError(context, error, metadata = {}) {
  const sanitizedMessage = sanitizeError(error);
  const sanitizedMetadata = sanitizeObject(metadata);
  
  console.error(`[${context}] Error:`, sanitizedMessage);
  if (Object.keys(sanitizedMetadata).length > 0) {
    console.error(`[${context}] Metadata:`, JSON.stringify(sanitizedMetadata));
  }
}

/**
 * Log info message
 * @param {string} context - Context where message occurred
 * @param {string} message - Message to log
 * @param {Object} metadata - Additional metadata to log
 */
function logInfo(context, message, metadata = {}) {
  const sanitizedMetadata = sanitizeObject(metadata);
  
  console.log(`[${context}] ${message}`);
  if (Object.keys(sanitizedMetadata).length > 0) {
    console.log(`[${context}] Metadata:`, JSON.stringify(sanitizedMetadata));
  }
}

/**
 * Log warning message
 * @param {string} context - Context where warning occurred
 * @param {string} message - Warning message
 * @param {Object} metadata - Additional metadata to log
 */
function logWarning(context, message, metadata = {}) {
  const sanitizedMetadata = sanitizeObject(metadata);
  
  console.warn(`[${context}] ${message}`);
  if (Object.keys(sanitizedMetadata).length > 0) {
    console.warn(`[${context}] Metadata:`, JSON.stringify(sanitizedMetadata));
  }
}

module.exports = {
  sanitizeError,
  sanitizeObject,
  logError,
  logInfo,
  logWarning
};
