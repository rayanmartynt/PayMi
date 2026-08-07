const express = require('express');
const router = express.Router();
const { merchantAuth, auth, customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { merchants, customers, transactions, paymentLinks } = require('../db/schema');
const PaymentGateway = require('../services/payment');
const StripePayment = require('../services/stripePayment');

// 2FA amount threshold for transactions (in SLE)
const TWO_FA_AMOUNT_THRESHOLD = 1000000; // 1,000,000 SLE - adjust based on local regulations

// Create payment link
router.post('/links', merchantAuth, async (req, res) => {
  try {
    const { title, description, amount, currency, expiresAt } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const paymentLinkResult = await db.insert(paymentLinks).values({
      merchantId: merchant.id,
      title,
      description,
      amount: amount.toString(),
      currency: currency || 'SLE',
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }).returning();
    
    const paymentLink = paymentLinkResult[0];

    res.json(paymentLink);
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// Get payment links for merchant
router.get('/links', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const paymentLinksResult = await db.select()
      .from(paymentLinks)
      .where(eq(paymentLinks.merchantId, merchant.id))
      .orderBy(desc(paymentLinks.createdAt));

    res.json(paymentLinksResult);
  } catch (error) {
    console.error('Get payment links error:', error);
    res.status(500).json({ error: 'Failed to get payment links' });
  }
});

// Process mobile money payment
router.post('/mobile-money', auth, async (req, res) => {
  try {
    const { phoneNumber, amount, paymentMethod, merchantId, description, twoFactorToken } = req.body;
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get merchant
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Check if amount exceeds 2FA threshold
    const amountValue = parseFloat(amount);
    if (amountValue >= TWO_FA_AMOUNT_THRESHOLD) {
      if (!twoFactorToken) {
        return res.status(403).json({ 
          error: 'Two-factor authentication required for transactions above threshold',
          requiresTwoFactor: true,
          threshold: TWO_FA_AMOUNT_THRESHOLD
        });
      }

      // Verify 2FA token
      const twoFactorService = require('../services/twoFactor');
      const isValid2FA = twoFactorService.verifyToken(req.user.twoFactorSecret, twoFactorToken);
      
      if (!isValid2FA) {
        return res.status(401).json({ error: 'Invalid two-factor token' });
      }
    }

    // Initialize payment gateway
    const gateway = new PaymentGateway(paymentMethod);
    const paymentResult = await gateway.initiatePayment(phoneNumber, amount, 'SLE', reference);

    if (paymentResult.success) {
      // Get customer if exists
      const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
      const customer = customerResult[0];

      // Create transaction record
      const transactionResult = await db.insert(transactions).values({
        merchantId: merchant.id,
        customerId: customer?.id || null,
        amount: amount.toString(),
        currency: 'SLE',
        paymentMethod,
        reference,
        description,
        status: 'PENDING'
      }).returning();
      
      const transaction = transactionResult[0];

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
    const { amount, currency, merchantId, description, twoFactorToken } = req.body;
    
    // Check if amount exceeds 2FA threshold (convert to SLE equivalent if needed)
    const amountValue = parseFloat(amount);
    if (currency === 'usd' && amountValue * 15000 >= TWO_FA_AMOUNT_THRESHOLD) {
      if (!twoFactorToken) {
        return res.status(403).json({ 
          error: 'Two-factor authentication required for transactions above threshold',
          requiresTwoFactor: true,
          threshold: TWO_FA_AMOUNT_THRESHOLD
        });
      }

      const twoFactorService = require('../services/twoFactor');
      const isValid2FA = twoFactorService.verifyToken(req.user.twoFactorSecret, twoFactorToken);
      
      if (!isValid2FA) {
        return res.status(401).json({ error: 'Invalid two-factor token' });
      }
    }
    
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const reference = `STRIPE-${paymentIntentId}`;

    // Get customer if exists
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    const transactionResult = await db.insert(transactions).values({
      merchantId: merchant.id,
      customerId: customer?.id || null,
      amount: amount.toString(),
      currency: 'USD',
      paymentMethod: 'STRIPE',
      reference,
      description,
      status: 'SUCCESSFUL'
    }).returning();
    
    const transaction = transactionResult[0];

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
