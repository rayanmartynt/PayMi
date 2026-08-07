const express = require('express');
const { auth, merchantAuth } = require('../middleware/auth');
const prisma = require('../db/index');

const router = express.Router();

// Create webhook
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { url, events, description, secret } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const webhook = await prisma.webhook.create({
      data: {
        merchantId: merchant.id,
        url,
        events: JSON.stringify(events),
        description,
        secret,
        status: 'active'
      }
    });

    res.json(webhook);
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Get webhooks for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const webhooks = await prisma.webhook.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' }
    });

    // Parse events from JSON string
    const webhooksWithParsedEvents = webhooks.map(webhook => ({
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
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: req.params.id },
      data: {
        url: url || webhook.url,
        events: events ? JSON.stringify(events) : webhook.events,
        description: description || webhook.description,
        secret: secret || webhook.secret,
        status: status || webhook.status
      }
    });

    res.json(updatedWebhook);
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await prisma.webhook.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook
router.post('/:id/test', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

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
