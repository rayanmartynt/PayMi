const express = require('express');
const { auth, merchantAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, webhooks } = require('../db/schema');

const router = express.Router();

// Create webhook
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { url, events, description, secret } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const webhookResult = await db.insert(webhooks).values({
      merchantId: merchant.id,
      url,
      events: JSON.stringify(events),
      description,
      secret,
      status: 'active'
    }).returning();
    
    const webhook = webhookResult[0];

    res.json(webhook);
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Get webhooks for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const webhooksResult = await db.select()
      .from(webhooks)
      .where(eq(webhooks.merchantId, merchant.id))
      .orderBy(desc(webhooks.createdAt));

    // Parse events from JSON string
    const webhooksWithParsedEvents = webhooksResult.map(webhook => ({
      ...webhook,
      events: JSON.parse(webhook.events)
    }));

    res.json(webhooksWithParsedEvents);
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

// Update webhook
router.put('/:id', merchantAuth, async (req, res) => {
  try {
    const { url, events, description, secret, status } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const webhookResult = await db.select()
      .from(webhooks)
      .where(and(eq(webhooks.id, req.params.id), eq(webhooks.merchantId, merchant.id)))
      .limit(1);
    
    const webhook = webhookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updatedWebhookResult = await db.update(webhooks)
      .set({
        url: url || webhook.url,
        events: events ? JSON.stringify(events) : webhook.events,
        description: description || webhook.description,
        secret: secret || webhook.secret,
        status: status || webhook.status
      })
      .where(eq(webhooks.id, req.params.id))
      .returning();
    
    const updatedWebhook = updatedWebhookResult[0];

    res.json(updatedWebhook);
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const webhookResult = await db.select()
      .from(webhooks)
      .where(and(eq(webhooks.id, req.params.id), eq(webhooks.merchantId, merchant.id)))
      .limit(1);
    
    const webhook = webhookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await db.delete(webhooks).where(eq(webhooks.id, req.params.id));

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook
router.post('/:id/test', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const webhookResult = await db.select()
      .from(webhooks)
      .where(and(eq(webhooks.id, req.params.id), eq(webhooks.merchantId, merchant.id)))
      .limit(1);
    
    const webhook = webhookResult[0];

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Send test webhook
    const axios = require('axios');
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      merchantId: merchant.id,
      test: true
    };

    try {
      await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret
        }
      });

      res.json({ message: 'Test webhook sent successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to send test webhook' });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

module.exports = router;
