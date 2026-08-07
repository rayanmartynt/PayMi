const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, transactions, invoices } = require('../db/schema');
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!amount || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Amount and items array are required' });
    }

    const invoiceResult = await db.insert(invoices).values({
      merchantId: merchant.id,
      customerId: customerId || null,
      invoiceNumber: generateInvoiceNumber(),
      amount: parseFloat(amount).toString(),
      currency,
      items: JSON.stringify(items),
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null
    }).returning();
    
    const invoice = invoiceResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(invoices.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(invoices.merchantId, merchant.id), eq(invoices.status, status));
    }

    const invoicesResult = await db.select()
      .from(invoices)
      .where(whereCondition)
      .orderBy(desc(invoices.createdAt));

    res.json({ invoices: invoicesResult });
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const invoiceResult = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.merchantId, merchant.id)))
      .limit(1);
    
    const invoice = invoiceResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const invoiceResult = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.merchantId, merchant.id)))
      .limit(1);
    
    const invoice = invoiceResult[0];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be sent' });
    }

    const updatedResult = await db.update(invoices)
      .set({ status: 'SENT' })
      .where(eq(invoices.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const invoiceResult = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.merchantId, merchant.id)))
      .limit(1);
    
    const invoice = invoiceResult[0];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    const transactionResult = await db.insert(transactions).values({
      merchantId: merchant.id,
      customerId: invoice.customerId,
      amount: invoice.amount,
      currency: invoice.currency,
      paymentMethod: 'INVOICE',
      status: 'SUCCESSFUL',
      description: `Invoice payment - ${invoice.invoiceNumber}`,
      reference: `INV_PAY_${invoice.id}_${Date.now()}`,
      metadata: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })
    }).returning();
    
    const transaction = transactionResult[0];

    const updatedResult = await db.update(invoices)
      .set({
        status: 'PAID',
        paidAt: new Date()
      })
      .where(eq(invoices.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const invoiceResult = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.merchantId, merchant.id)))
      .limit(1);
    
    const invoice = invoiceResult[0];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot cancel paid invoice' });
    }

    const updatedResult = await db.update(invoices)
      .set({ status: 'CANCELLED' })
      .where(eq(invoices.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const invoiceResult = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.merchantId, merchant.id)))
      .limit(1);
    
    const invoice = invoiceResult[0];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be deleted' });
    }

    await db.delete(invoices).where(eq(invoices.id, req.params.id));

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
