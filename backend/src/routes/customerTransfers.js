const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, or, and, desc } = require('drizzle-orm');
const { customers, users, customerTransfers, adminFees } = require('../db/schema');

const router = express.Router();

// Get customer transfers
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const conditions = status 
      ? and(
          or(eq(customerTransfers.senderId, customer.id), eq(customerTransfers.receiverId, customer.id)),
          eq(customerTransfers.status, status)
        )
      : or(eq(customerTransfers.senderId, customer.id), eq(customerTransfers.receiverId, customer.id));

    const transfersResult = await db.select({
      transfer: customerTransfers,
      sender: { customer: customers, user: users },
      receiver: { customer: customers, user: users }
    })
    .from(customerTransfers)
    .where(conditions)
    .orderBy(desc(customerTransfers.createdAt))
    .limit(parseInt(limit))
    .offset(offset);

    // Count total
    const countResult = await db.select({ count: customerTransfers.id })
      .from(customerTransfers)
      .where(conditions);
    const total = countResult.length;

    res.json({
      transfers: transfersResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer transfers error:', error);
    res.status(500).json({ error: 'Failed to get transfers' });
  }
});

// Create transfer
router.post('/', customerAuth, async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body;
    
    const senderResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const sender = senderResult[0];

    if (!sender) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check KYC status
    if (!sender.kycVerified) {
      return res.status(403).json({ error: 'KYC verification required. Please complete your identity verification to transfer funds.' });
    }

    // Find receiver by email
    const receiverUserResult = await db.select().from(users).where(eq(users.email, receiverEmail)).limit(1);
    const receiverUser = receiverUserResult[0];

    if (!receiverUser) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const receiverCustomerResult = await db.select().from(customers).where(eq(customers.userId, receiverUser.id)).limit(1);
    const receiverCustomer = receiverCustomerResult[0];

    if (!receiverCustomer) {
      return res.status(404).json({ error: 'Receiver customer not found' });
    }

    if (sender.id === receiverCustomer.id) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    if (parseFloat(sender.balance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate fee (3% for customer transfers)
    const fee = amount * 0.03;
    const amountAfterFee = amount - fee;

    // Create transfer
    const transferResult = await db.insert(customerTransfers).values({
      senderId: sender.id,
      receiverId: receiverCustomer.id,
      amount: amount.toString(),
      fee: fee.toString(),
      description,
      reference,
      status: 'COMPLETED'
    }).returning();

    const transfer = transferResult[0];

    // Update balances and record fee in transaction
    await db.transaction(async (tx) => {
      await tx.update(customers)
        .set({ balance: (parseFloat(sender.balance) - amount).toString() })
        .where(eq(customers.id, sender.id));
      
      await tx.update(customers)
        .set({ balance: (parseFloat(receiverCustomer.balance) + amountAfterFee).toString() })
        .where(eq(customers.id, receiverCustomer.id));
      
      // Record admin fee
      await tx.insert(adminFees).values({
        type: 'CUSTOMER_TRANSFER',
        amount: amount.toString(),
        fee: fee.toString(),
        currency: 'SLE',
        referenceId: transfer.id
      });
    });

    // Notify receiver
    if (global.io) {
      global.io.to(receiverUser.id).emit('transfer_received', {
        transferId: transfer.id,
        amount,
        sender: sender.name
      });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Reverse transfer
router.post('/:id/reverse', customerAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transferResult = await db.select().from(customerTransfers).where(eq(customerTransfers.id, req.params.id)).limit(1);
    const transfer = transferResult[0];

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.senderId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (transfer.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only reverse completed transfers' });
    }

    // Get sender and receiver customers
    const senderResult = await db.select().from(customers).where(eq(customers.id, transfer.senderId)).limit(1);
    const receiverResult = await db.select().from(customers).where(eq(customers.id, transfer.receiverId)).limit(1);
    const sender = senderResult[0];
    const receiver = receiverResult[0];

    // Reverse the transfer
    await db.transaction(async (tx) => {
      await tx.update(customers)
        .set({ balance: (parseFloat(sender.balance) + parseFloat(transfer.amount)).toString() })
        .where(eq(customers.id, transfer.senderId));
      
      await tx.update(customers)
        .set({ balance: (parseFloat(receiver.balance) - parseFloat(transfer.amount)).toString() })
        .where(eq(customers.id, transfer.receiverId));
      
      await tx.update(customerTransfers)
        .set({
          status: 'REVERSED',
          reversedAt: new Date(),
          reversalReason: reason
        })
        .where(eq(customerTransfers.id, req.params.id));
    });

    // Notify receiver
    if (global.io) {
      global.io.to(transfer.receiverId).emit('transfer_reversed', {
        transferId: transfer.id,
        reason
      });
    }

    res.json({ message: 'Transfer reversed successfully' });
  } catch (error) {
    console.error('Reverse transfer error:', error);
    res.status(500).json({ error: 'Failed to reverse transfer' });
  }
});

module.exports = router;
