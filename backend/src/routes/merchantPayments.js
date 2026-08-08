const express = require('express');
const { customerAuth, requireFullVerification } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and } = require('drizzle-orm');
const { customers, merchants, transactions, adminFees } = require('../db/schema');

const router = express.Router();

// Generate unique 6-character alphanumeric merchant ID
function generateMerchantId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Payment to merchant by ID
router.post('/pay-by-id', customerAuth, requireFullVerification, async (req, res) => {
  try {
    const { merchantId, amount, paymentMethod, description } = req.body;

    if (!merchantId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Merchant ID, amount, and payment method are required' });
    }

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find merchant by merchant ID
    const merchantResult = await db.select().from(merchants).where(eq(merchants.merchantId, merchantId.toUpperCase())).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found with this ID' });
    }

    if (!merchant.isApproved) {
      return res.status(403).json({ error: 'Merchant is not approved for payments' });
    }

    if (parseFloat(customer.balance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate fee (2% for merchant payments)
    const fee = amount * 0.02;
    const totalAmount = parseFloat(amount) + fee;

    // Deduct from customer
    await db.update(customers)
      .set({ balance: (parseFloat(customer.balance) - totalAmount).toString() })
      .where(eq(customers.id, customer.id));

    // Add to merchant
    await db.update(merchants)
      .set({ balance: (parseFloat(merchant.balance) + parseFloat(amount)).toString() })
      .where(eq(merchants.id, merchant.id));

    // Create transaction record
    const transaction = await db.insert(transactions).values({
      merchantId: merchant.id,
      customerId: customer.id,
      amount: amount.toString(),
      currency: 'SLE',
      status: 'COMPLETED',
      paymentMethod,
      paymentGateway: 'PAYMI',
      transactionReference: reference,
      description: description || `Payment to ${merchant.businessName}`
    }).returning();

    // Record admin fee
    await db.insert(adminFees).values({
      type: 'PAYMENT_FEE',
      amount: amount.toString(),
      fee: fee.toString(),
      currency: 'SLE',
      referenceId: transaction[0].id
    });

    res.json({
      message: 'Payment successful',
      transaction: transaction[0],
      merchant: {
        id: merchant.id,
        merchantId: merchant.merchantId,
        businessName: merchant.businessName
      },
      newBalance: (parseFloat(customer.balance) - totalAmount).toString()
    });
  } catch (error) {
    console.error('Merchant payment error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// Get merchant info by ID (for payment verification)
router.get('/merchant/:merchantId', customerAuth, async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await db.select().from(merchants).where(eq(merchants.merchantId, merchantId.toUpperCase())).limit(1);

    if (merchant.length === 0) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Return only public info
    res.json({
      merchantId: merchant[0].merchantId,
      businessName: merchant[0].businessName,
      isApproved: merchant[0].isApproved
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({ error: 'Failed to get merchant info' });
  }
});

module.exports = router;
