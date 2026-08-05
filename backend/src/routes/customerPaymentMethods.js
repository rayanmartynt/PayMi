const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get customer payment methods
router.get('/', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    res.json(paymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Add payment method
router.post('/', customerAuth, async (req, res) => {
  try {
    const { type, phoneNumber } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    // If this is the first payment method, make it default
    const existingMethods = await prisma.paymentMethod.count({
      where: { customerId: customer.id }
    });

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        customerId: customer.id,
        type,
        phoneNumber,
        isDefault: existingMethods === 0
      }
    });

    res.json(paymentMethod);
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Delete payment method
router.delete('/:id', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        customerId: customer.id
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    await prisma.paymentMethod.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Set default payment method
router.post('/:id/default', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        customerId: customer.id
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Remove default from all other methods
    await prisma.paymentMethod.updateMany({
      where: {
        customerId: customer.id,
        id: { not: req.params.id }
      },
      data: { isDefault: false }
    });

    // Set this one as default
    await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data: { isDefault: true }
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

module.exports = router;
