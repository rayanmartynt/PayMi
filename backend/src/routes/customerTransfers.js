const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get customer transfers
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const where = {
      OR: [
        { senderId: customer.id },
        { receiverId: customer.id }
      ],
      ...(status ? { status } : {})
    };

    const [transfers, total] = await Promise.all([
      prisma.customerTransfer.findMany({
        where,
        include: {
          sender: { include: { user: true } },
          receiver: { include: { user: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerTransfer.count({ where })
    ]);

    res.json({
      transfers,
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
    const sender = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    // Find receiver by email
    const receiverUser = await prisma.user.findUnique({
      where: { email: receiverEmail },
      include: { customer: true }
    });

    if (!receiverUser || !receiverUser.customer) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    if (sender.id === receiverUser.customer.id) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create transfer
    const transfer = await prisma.customerTransfer.create({
      data: {
        senderId: sender.id,
        receiverId: receiverUser.customer.id,
        amount,
        description,
        reference,
        status: 'COMPLETED'
      },
      include: {
        sender: { include: { user: true } },
        receiver: { include: { user: true } }
      }
    });

    // Update balances
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } }
      }),
      prisma.customer.update({
        where: { id: receiverUser.customer.id },
        data: { balance: { increment: amount } }
      })
    ]);

    // Notify receiver
    if (global.io) {
      global.io.to(receiverUser.id).emit('transfer_received', {
        transferId: transfer.id,
        amount,
        sender: sender.user.name
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
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const transfer = await prisma.customerTransfer.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { include: { user: true } },
        receiver: { include: { user: true } }
      }
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.senderId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (transfer.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only reverse completed transfers' });
    }

    // Reverse the transfer
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: transfer.senderId },
        data: { balance: { increment: transfer.amount } }
      }),
      prisma.customer.update({
        where: { id: transfer.receiverId },
        data: { balance: { decrement: transfer.amount } }
      }),
      prisma.customerTransfer.update({
        where: { id: req.params.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversalReason: reason
        }
      })
    ]);

    // Notify receiver
    if (global.io) {
      global.io.to(transfer.receiver.userId).emit('transfer_reversed', {
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
