const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { apiKeys, merchants, users } = require('../db/schema');

const apiAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    // Find the API key
    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.publicKey, apiKey)).limit(1);
    const key = keyResult[0];

    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!key.isActive) {
      return res.status(403).json({ error: 'API key has been revoked' });
    }

    // Get merchant and user data
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, key.merchantId)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(401).json({ error: 'Merchant not found' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, merchant.userId)).limit(1);
    const user = userResult[0];

    // Update last used timestamp
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, key.id));

    req.apiKey = key;
    req.merchant = merchant;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('API auth error:', error);
    res.status(401).json({ error: 'API authentication failed' });
  }
};

const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.header('X-Webhook-Signature');
    const webhookSecret = req.header('X-Webhook-Secret');
    
    if (!signature || !webhookSecret) {
      return res.status(401).json({ error: 'Missing signature or secret' });
    }

    // Verify signature (basic implementation - can be enhanced)
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    res.status(401).json({ error: 'Signature verification failed' });
  }
};

module.exports = { apiAuth, verifyWebhookSignature };
