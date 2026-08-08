const db = require('../db/index');
const { auditLogs } = require('../db/schema');
const { eq, and, gte, lte, desc } = require('drizzle-orm');

/**
 * Audit log service for tracking critical operations
 * This helps with compliance and security monitoring
 */

const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_SENT: 'EMAIL_VERIFICATION_SENT',
  PHONE_VERIFIED: 'PHONE_VERIFIED',
  PHONE_VERIFICATION_SENT: 'PHONE_VERIFICATION_SENT',
  
  // Financial operations
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_SUCCESSFUL: 'PAYMENT_SUCCESSFUL',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  WITHDRAWAL_REQUESTED: 'WITHDRAWAL_REQUESTED',
  WITHDRAWAL_PROCESSED: 'WITHDRAWAL_PROCESSED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
  TRANSFER_CREATED: 'TRANSFER_CREATED',
  TRANSFER_REVERSED: 'TRANSFER_REVERSED',
  
  // KYC operations
  KYC_SUBMITTED: 'KYC_SUBMITTED',
  KYC_APPROVED: 'KYC_APPROVED',
  KYC_REJECTED: 'KYC_REJECTED',
  
  // Admin operations
  MERCHANT_APPROVED: 'MERCHANT_APPROVED',
  MERCHANT_REJECTED: 'MERCHANT_REJECTED',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  
  // API operations
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_REGENERATED: 'API_KEY_REGENERATED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  API_KEY_DELETED: 'API_KEY_DELETED',
  
  // Webhook operations
  WEBHOOK_CREATED: 'WEBHOOK_CREATED',
  WEBHOOK_UPDATED: 'WEBHOOK_UPDATED',
  WEBHOOK_DELETED: 'WEBHOOK_DELETED',
};

/**
 * Create an audit log entry
 * @param {string} action - The action being performed
 * @param {string} userId - The user performing the action
 * @param {string} userType - The type of user (MERCHANT, CUSTOMER, ADMIN)
 * @param {object} details - Additional details about the action
 * @param {string} ipAddress - The IP address of the user
 * @param {string} userAgent - The user agent string
 */
async function createAuditLog(action, userId, userType, details = {}, ipAddress = null, userAgent = null) {
  try {
    // Sanitize sensitive data from details before logging
    const sanitizedDetails = sanitizeDetails(details);
    
    const auditLog = await db.insert(auditLogs).values({
      action,
      userId,
      userType,
      details: JSON.stringify(sanitizedDetails),
      ipAddress,
      userAgent,
      timestamp: new Date()
    }).returning();
    
    return auditLog[0];
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging failure shouldn't break the main operation
    return null;
  }
}

/**
 * Sanitize sensitive data from audit log details
 * @param {object} details - The details object to sanitize
 * @returns {object} - Sanitized details
 */
function sanitizeDetails(details) {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'webhookSecret', 'twoFactorSecret', 'twoFactorBackupCodes'];
  
  const sanitized = { ...details };
  
  for (const key of sensitiveKeys) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  // Also check nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeDetails(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Get audit logs for a user
 * @param {string} userId - The user ID
 * @param {object} options - Query options (limit, offset, action, startDate, endDate)
 */
async function getUserAuditLogs(userId, options = {}) {
  try {
    const { limit = 50, offset = 0, action, startDate, endDate } = options;
    
    const conditions = [eq(auditLogs.userId, userId)];
    
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    
    if (startDate || endDate) {
      if (startDate) conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
      if (endDate) conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }
    
    const logs = await db.select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
    
    const totalResult = await db.select({ count: auditLogs.id })
      .from(auditLogs)
      .where(and(...conditions));
    
    return { logs, total: totalResult.length };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

/**
 * Get audit logs for a specific action
 * @param {string} action - The action to filter by
 * @param {object} options - Query options (limit, offset, startDate, endDate)
 */
async function getAuditLogsByAction(action, options = {}) {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = options;
    
    const conditions = [eq(auditLogs.action, action)];
    
    if (startDate || endDate) {
      if (startDate) conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
      if (endDate) conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }
    
    const logs = await db.select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
    
    const totalResult = await db.select({ count: auditLogs.id })
      .from(auditLogs)
      .where(and(...conditions));
    
    return { logs, total: totalResult.length };
  } catch (error) {
    console.error('Failed to get audit logs by action:', error);
    throw error;
  }
}

module.exports = {
  AUDIT_ACTIONS,
  createAuditLog,
  getUserAuditLogs,
  getAuditLogsByAction
};
