const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and, ne } = require('drizzle-orm');
const { customers, paymentMethods } = require('../db/schema');

const router = express.Router();

// Get customer payment methods
router.get('/', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const paymentMethodsResult = await db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.customerId, customer.id))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

    res.json(paymentMethodsResult);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Add payment method
router.post('/', customerAuth, async (req, res) => {
  try {
    const { type, phoneNumber } = req.body;
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // If this is the first payment method, make it default
    const existingMethodsResult = await db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.customerId, customer.id));
    
    const existingMethods = existingMethodsResult.length;

    const paymentMethodResult = await db.insert(paymentMethods).values({
      customerId: customer.id,
      type,
      phoneNumber,
      isDefault: existingMethods === 0
    }).returning();
    
    const paymentMethod = paymentMethodResult[0];

    res.json(paymentMethod);
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Delete payment method
router.delete('/:id', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const paymentMethodResult = await db.select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, req.params.id), eq(paymentMethods.customerId, customer.id)))
      .limit(1);
    
    const paymentMethod = paymentMethodResult[0];

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    await db.delete(paymentMethods).where(eq(paymentMethods.id, req.params.id));

    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Set default payment method
router.post('/:id/default', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const paymentMethodResult = await db.select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, req.params.id), eq(paymentMethods.customerId, customer.id)))
      .limit(1);
    
    const paymentMethod = paymentMethodResult[0];

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Remove default from all other methods
    await db.update(paymentMethods)
      .set({ isDefault: false })
      .where(and(eq(paymentMethods.customerId, customer.id), ne(paymentMethods.id, req.params.id)));

    // Set this one as default
    await db.update(paymentMethods)
      .set({ isDefault: true })
      .where(eq(paymentMethods.id, req.params.id));

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

module.exports = router;
