const express = require('express');
const { merchantAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { webhooks, merchants } = require('../db/schema');
const crypto = require('crypto');

const router = express.Router();

// Generate webhook secret
function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

// Get all webhooks for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hooks = await db.select()
      .from(webhooks)
      .where(eq(webhooks.merchantId, merchant.id))
      .orderBy(desc(webhooks.createdAt));

    // Don't return the secret in list view
    const safeHooks = hooks.map(hook => ({
      ...hook,
      secret: hook.secret.substring(0, 12) + '...' // Show only first 12 chars
    }));

    res.json(safeHooks);
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

// Create new webhook
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { url, events = ['payment.completed', 'payment.failed'] } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const secret = generateWebhookSecret();

    const newWebhook = await db.insert(webhooks).values({
      merchantId: merchant.id,
      url,
      secret,
      events: JSON.stringify(events),
      isActive: true
    }).returning();

    res.json({
      message: 'Webhook created successfully',
      webhook: newWebhook[0],
      secret: secret // Only show secret once during creation
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Get specific webhook
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hookResult = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    const webhook = hookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(webhook);
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Failed to get webhook' });
  }
});

// Update webhook
router.put('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, events, isActive } = req.body;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hookResult = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    const webhook = hookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (url) {
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }
    if (events) updateData.events = JSON.stringify(events);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedWebhook = await db.update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, id))
      .returning();

    res.json({
      message: 'Webhook updated successfully',
      webhook: updatedWebhook[0]
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hookResult = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    const webhook = hookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.delete(webhooks).where(eq(webhooks.id, id));

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Regenerate webhook secret
router.post('/:id/regenerate', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hookResult = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    const webhook = hookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newSecret = generateWebhookSecret();

    const updatedWebhook = await db.update(webhooks)
      .set({ secret: newSecret })
      .where(eq(webhooks.id, id))
      .returning();

    res.json({
      message: 'Webhook secret regenerated successfully',
      webhook: updatedWebhook[0],
      secret: newSecret
    });
  } catch (error) {
    console.error('Regenerate webhook error:', error);
    res.status(500).json({ error: 'Failed to regenerate webhook secret' });
  }
});

// Test webhook
router.post('/:id/test', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const hookResult = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    const webhook = hookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Send test webhook
    const testPayload = {
      event: 'test',
      data: {
        message: 'This is a test webhook from PayMi',
        timestamp: new Date().toISOString()
      }
    };

    const payload = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PayMi-Signature': signature,
        'X-PayMi-Event': 'test'
      },
      body: payload
    });

    // Update last triggered timestamp
    await db.update(webhooks)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(webhooks.id, webhook.id));

    res.json({
      message: 'Test webhook sent',
      success: response.ok,
      statusCode: response.status
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to send test webhook' });
  }
});

module.exports = router;
