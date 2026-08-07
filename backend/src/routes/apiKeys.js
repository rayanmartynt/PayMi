const express = require('express');
const { merchantAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { merchants, apiKeys } = require('../db/schema');
const crypto = require('crypto');

const router = express.Router();

// Get API keys for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    const keysResult = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.merchantId, merchant.id))
      .orderBy(desc(apiKeys.createdAt));

    // Don't expose secret keys in list
    const safeKeys = keysResult.map(key => ({
      ...key,
      key: '••••••••••••••••',
      secret: '••••••••••••••••'
    }));

    res.json(safeKeys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create API key
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    const key = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const secret = `sk_${crypto.randomBytes(32).toString('hex')}`;

    const apiKeyResult = await db.insert(apiKeys).values({
      merchantId: merchant.id,
      key,
      secret,
      name: name || 'Default API Key',
      permissions: permissions || JSON.stringify(['read', 'write']),
      isActive: true
    }).returning();
    
    const apiKey = apiKeyResult[0];

    res.json(apiKey);
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Regenerate API key
router.post('/:id/regenerate', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    const apiKeyResult = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.id, req.params.id))
      .limit(1);
    
    const apiKey = apiKeyResult[0];

    if (!apiKey || apiKey.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const newKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const newSecret = `sk_${crypto.randomBytes(32).toString('hex')}`;

    const updatedKeyResult = await db.update(apiKeys)
      .set({ key: newKey, secret: newSecret })
      .where(eq(apiKeys.id, req.params.id))
      .returning();
    
    const updatedKey = updatedKeyResult[0];

    res.json(updatedKey);
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// Revoke API key
router.post('/:id/revoke', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    const apiKeyResult = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.id, req.params.id))
      .limit(1);
    
    const apiKey = apiKeyResult[0];

    if (!apiKey || apiKey.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, req.params.id));

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Delete API key
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    const apiKeyResult = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.id, req.params.id))
      .limit(1);
    
    const apiKey = apiKeyResult[0];

    if (!apiKey || apiKey.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, req.params.id));

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

module.exports = router;
