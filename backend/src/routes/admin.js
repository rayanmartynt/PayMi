const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalMerchants,
      totalCustomers,
      totalTransactions,
      totalRevenue,
      pendingKYC,
      pendingWithdrawals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.merchant.count(),
      prisma.customer.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amount: true }
      }),
      prisma.kYCDocument.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      totalUsers,
      totalMerchants,
      totalCustomers,
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingKYC,
      pendingWithdrawals
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get all merchants
router.get('/merchants', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        include: {
          user: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.merchant.count({ where })
    ]);

    res.json({
      merchants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ error: 'Failed to get merchants' });
  }
});

// Approve merchant
router.post('/merchants/:id/approve', adminAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
      include: { user: true }
    });

    await prisma.user.update({
      where: { id: merchant.userId },
      data: { kycStatus: 'APPROVED' }
    });

    res.json(merchant);
  } catch (error) {
    console.error('Approve merchant error:', error);
    res.status(500).json({ error: 'Failed to approve merchant' });
  }
});

// Reject merchant
router.post('/merchants/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      include: { user: true }
    });

    await prisma.user.update({
      where: { id: merchant.userId },
      data: { kycStatus: 'REJECTED' }
    });

    res.json(merchant);
  } catch (error) {
    console.error('Reject merchant error:', error);
    res.status(500).json({ error: 'Failed to reject merchant' });
  }
});

// Get all transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          merchant: { include: { user: true } },
          customer: { include: { user: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get withdrawals
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          merchant: { include: { user: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.withdrawal.count({ where })
    ]);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// Process withdrawal
router.post('/withdrawals/:id/process', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const withdrawal = await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionReason,
        processedAt: new Date()
      },
      include: {
        merchant: { include: { user: true } }
      }
    });

    // Notify merchant
    if (global.io) {
      global.io.to(withdrawal.merchant.userId).emit('withdrawal_processed', {
        withdrawalId: withdrawal.id,
        status,
        rejectionReason
      });
    }

    res.json(withdrawal);
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get disputes
router.get('/disputes', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        include: {
          customer: { include: { user: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dispute.count()
    ]);

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Failed to get disputes' });
  }
});

// Get fraud alerts (placeholder)
router.get('/fraud-alerts', adminAuth, async (req, res) => {
  try {
    // Placeholder for fraud detection system
    res.json({
      alerts: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ error: 'Failed to get fraud alerts' });
  }
});

module.exports = router;
