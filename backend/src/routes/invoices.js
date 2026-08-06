const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Generate invoice number
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

/**
 * Create an invoice
 * POST /api/invoices
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { customerId, amount, currency = 'SLE', items, notes, dueDate } = req.body;
    const merchant = req.merchant;

    if (!amount || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Amount and items array are required' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        merchantId: merchant.id,
        customerId: customerId || null,
        invoiceNumber: generateInvoiceNumber(),
        amount: parseFloat(amount),
        currency,
        items: JSON.stringify(items),
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * Get merchant invoices
 * GET /api/invoices
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

/**
 * Send invoice
 * POST /api/invoices/:id/send
 */
router.post('/:id/send', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be sent' });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' }
    });

    res.json({
      message: 'Invoice sent successfully',
      invoice: updated
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

/**
 * Mark invoice as paid
 * POST /api/invoices/:id/pay
 */
router.post('/:id/pay', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        merchantId: merchant.id,
        customerId: invoice.customerId,
        amount: invoice.amount,
        currency: invoice.currency,
        paymentMethod: 'INVOICE',
        status: 'SUCCESSFUL',
        description: `Invoice payment - ${invoice.invoiceNumber}`,
        reference: `INV_PAY_${invoice.id}_${Date.now()}`,
        metadata: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })
      }
    });

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    if (global.io) {
      global.io.to(merchant.id).emit('invoice', {
        type: 'paid',
        invoice: updated,
        transaction
      });
    }

    res.json({
      message: 'Invoice marked as paid',
      invoice: updated,
      transaction
    });
  } catch (error) {
    console.error('Pay invoice error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

/**
 * Cancel invoice
 * POST /api/invoices/:id/cancel
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot cancel paid invoice' });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Invoice cancelled successfully',
      invoice: updated
    });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

/**
 * Delete invoice
 * DELETE /api/invoices/:id
 */
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be deleted' });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
