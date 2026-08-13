const express = require('express');
const { merchantAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { apiKeys, merchants } = require('../db/schema');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Generate API key and secret
function generateApiKey() {
  return `pk_${crypto.randomBytes(16).toString('hex')}`;
}

function generateApiSecret() {
  return `sk_${crypto.randomBytes(32).toString('hex')}`;
}

// Get all API keys for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const keys = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.merchantId, merchant.id))
      .orderBy(desc(apiKeys.createdAt));

    // Don't return the secret in list view
    const safeKeys = keys.map(key => ({
      ...key,
      secret: key.secret.substring(0, 8) + '...' // Show only first 8 chars
    }));

    res.json(safeKeys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create new API key
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { name, permissions = ['payments'], expiresIn } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const key = generateApiKey();
    const secret = generateApiSecret();
    const hashedSecret = await bcrypt.hash(secret, 10);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000 * 60 * 60 * 24) : null;

    const newKey = await db.insert(apiKeys).values({
      merchantId: merchant.id,
      key,
      secret: hashedSecret,
      name,
      permissions: JSON.stringify(permissions),
      isActive: true,
      expiresAt
    }).returning();

    res.json({
      message: 'API key created successfully',
      apiKey: newKey[0],
      // Only show secret once during creation
      secret: secret
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Get specific API key (with secret for copy)
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
    const apiKey = keyResult[0];

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (apiKey.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(apiKey);
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

// Update API key
router.put('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, isActive } = req.body;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
    const apiKey = keyResult[0];

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (apiKey.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedKey = await db.update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, id))
      .returning();

    res.json({
      message: 'API key updated successfully',
      apiKey: updatedKey[0]
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
    const apiKey = keyResult[0];

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (apiKey.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Regenerate API key secret
router.post('/:id/regenerate', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const keyResult = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
    const apiKey = keyResult[0];

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (apiKey.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newSecret = generateApiSecret();
    const hashedSecret = await bcrypt.hash(newSecret, 10);

    const updatedKey = await db.update(apiKeys)
      .set({ secret: hashedSecret })
      .where(eq(apiKeys.id, id))
      .returning();

    res.json({
      message: 'API key secret regenerated successfully',
      apiKey: updatedKey[0],
      // Only show secret once during regeneration
      secret: newSecret
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

module.exports = router;
