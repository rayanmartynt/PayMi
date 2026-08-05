const express = require('express');
const { merchantAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const crypto = require('crypto');

const router = express.Router();

// Get API keys for merchant
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const apiKeys = await prisma.apiKey.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' }
    });

    // Don't expose secret keys in list
    const safeKeys = apiKeys.map(key => ({
      ...key,
      secretKey: '••••••••••••••••',
      webhookSecret: '••••••••••••••••'
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
    const { name } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    // Check if merchant already has an API key
    const existingKey = await prisma.apiKey.findFirst({
      where: { merchantId: merchant.id }
    });

    if (existingKey) {
      return res.status(400).json({ error: 'Merchant already has an API key' });
    }

    const publicKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const secretKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const webhookSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        name,
        publicKey,
        secretKey,
        webhookSecret
      }
    });

    res.json(apiKey);
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Regenerate API key
router.post('/:id/regenerate', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const newPublicKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const newSecretKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const newWebhookSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const updatedKey = await prisma.apiKey.update({
      where: { id: req.params.id },
      data: {
        publicKey: newPublicKey,
        secretKey: newSecretKey,
        webhookSecret: newWebhookSecret
      }
    });

    res.json(updatedKey);
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// Revoke API key
router.post('/:id/revoke', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Delete API key
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

module.exports = router;
