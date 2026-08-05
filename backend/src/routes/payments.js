const express = require('express');
const { auth, merchantAuth, customerAuth } = require('../middleware/auth');
const { PaymentGateway, StripePayment } = require('../services/payment');
const prisma = require('../lib/prisma');

const router = express.Router();

// Create payment link
router.post('/links', merchantAuth, async (req, res) => {
  try {
    const { title, description, amount, currency, expiresAt } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const paymentLink = await prisma.paymentLink.create({
      data: {
        merchantId: merchant.id,
        title,
        description,
        amount: parseFloat(amount),
        currency: currency || 'SLE',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    res.json(paymentLink);
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// Get payment links for merchant
router.get('/links', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const paymentLinks = await prisma.paymentLink.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(paymentLinks);
  } catch (error) {
    console.error('Get payment links error:', error);
    res.status(500).json({ error: 'Failed to get payment links' });
  }
});

// Process mobile money payment
router.post('/mobile-money', auth, async (req, res) => {
  try {
    const { phoneNumber, amount, paymentMethod, merchantId, description } = req.body;
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Initialize payment gateway
    const gateway = new PaymentGateway(paymentMethod);
    const paymentResult = await gateway.initiatePayment(phoneNumber, amount, 'SLE', reference);

    if (paymentResult.success) {
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          merchantId: merchant.id,
          customerId: req.user.customer?.id || null,
          amount,
          currency: 'SLE',
          paymentMethod,
          reference,
          description,
          status: 'PENDING'
        }
      });

      // Notify merchant about new payment
      if (global.io) {
        global.io.to(merchant.userId).emit('new_payment', {
          transactionId: transaction.id,
          amount,
          paymentMethod
        });
      }

      res.json({
        success: true,
        transaction,
        message: 'Payment initiated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment initiation failed'
      });
    }
  } catch (error) {
    console.error('Mobile money payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Create Stripe payment intent
router.post('/stripe/intent', auth, async (req, res) => {
  try {
    const { amount, currency, merchantId, description } = req.body;
    
    const stripePayment = new StripePayment();
    const result = await stripePayment.createPaymentIntent(amount, currency || 'usd', {
      merchantId,
      description
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: 'Failed to create payment intent' });
    }
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Confirm Stripe payment
router.post('/stripe/confirm', auth, async (req, res) => {
  try {
    const { paymentIntentId, merchantId, amount, description } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const reference = `STRIPE-${paymentIntentId}`;

    const transaction = await prisma.transaction.create({
      data: {
        merchantId: merchant.id,
        customerId: req.user.customer?.id || null,
        amount,
        currency: 'USD',
        paymentMethod: 'STRIPE',
        reference,
        description,
        status: 'SUCCESSFUL'
      }
    });

    // Notify merchant
    if (global.io) {
      global.io.to(merchant.userId).emit('new_payment', {
        transactionId: transaction.id,
        amount,
        paymentMethod: 'STRIPE'
      });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

module.exports = router;
