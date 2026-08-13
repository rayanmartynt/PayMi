const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { apiKeys, merchants } = require('../db/schema');
const bcrypt = require('bcryptjs');
const { logError } = require('../utils/logger');

// Middleware to authenticate requests using API key
async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      return res.status(401).json({ error: 'API key and secret are required' });
    }

    // Find the API key
    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    const apiKeyData = keyResult[0];

    if (!apiKeyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Verify secret using bcrypt comparison
    const isValid = await bcrypt.compare(apiSecret, apiKeyData.secret);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid API secret' });
    }

    // Check if key is active
    if (!apiKeyData.isActive) {
      return res.status(401).json({ error: 'API key is inactive' });
    }

    // Check if key has expired
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    // Get merchant details
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, apiKeyData.merchantId)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(401).json({ error: 'Merchant not found' });
    }

    if (!merchant.isApproved) {
      return res.status(403).json({ error: 'Merchant account is not approved' });
    }

    // Update last used timestamp
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyData.id));

    // Attach merchant and API key info to request
    req.apiKey = apiKeyData;
    req.merchant = merchant;

    next();
  } catch (error) {
    logError('APIKeyAuth', error, { path: req.path });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Middleware to check specific permissions
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key not found' });
    }

    const permissions = JSON.parse(req.apiKey.permissions || '[]');
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
}

module.exports = { apiKeyAuth, requirePermission };
