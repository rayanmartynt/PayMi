const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and, gte, lte, sql } = require('drizzle-orm');
const { users, merchants, customers, transactions, withdrawals, customerWithdrawals, kycDocuments, adminFees, disputes } = require('../db/schema');

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
      pendingMerchantWithdrawals,
      pendingCustomerWithdrawals,
      totalFees
    ] = await Promise.all([
      db.select({ count: users.id }).from(users),
      db.select({ count: merchants.id }).from(merchants),
      db.select({ count: customers.id }).from(customers),
      db.select({ count: transactions.id }).from(transactions),
      db.select({ sum: sql`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions).where(eq(transactions.status, 'SUCCESSFUL')),
      db.select({ count: kycDocuments.id }).from(kycDocuments).where(eq(kycDocuments.status, 'PENDING')),
      db.select({ count: withdrawals.id }).from(withdrawals).where(eq(withdrawals.status, 'PENDING')),
      db.select({ count: customerWithdrawals.id }).from(customerWithdrawals).where(eq(customerWithdrawals.status, 'PENDING')),
      db.select({ sum: sql`COALESCE(SUM(${adminFees.fee}), 0)` }).from(adminFees)
    ]);

    res.json({
      totalUsers: totalUsers.length,
      totalMerchants: totalMerchants.length,
      totalCustomers: totalCustomers.length,
      totalTransactions: totalTransactions.length,
      totalRevenue: parseFloat(totalRevenue[0].sum) || 0,
      pendingKYC: pendingKYC.length,
      pendingWithdrawals: pendingMerchantWithdrawals.length + pendingCustomerWithdrawals.length,
      totalFees: parseFloat(totalFees[0].sum) || 0
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
    const offset = (page - 1) * limit;

    const conditions = status ? eq(merchants.status, status) : undefined;

    const merchantsResult = await db.select()
      .from(merchants)
      .where(conditions)
      .orderBy(desc(merchants.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: merchants.id })
      .from(merchants)
      .where(conditions);
    const total = countResult.length;

    // Get user data for each merchant
    const merchantIds = merchantsResult.map(m => m.userId);
    const usersResult = await db.select().from(users).where(sql`${users.id} = ANY(${merchantIds})`);
    const usersMap = new Map(usersResult.map(u => [u.id, u]));

    const merchantsWithUsers = merchantsResult.map(m => ({
      ...m,
      user: usersMap.get(m.userId)
    }));

    res.json({
      merchants: merchantsWithUsers,
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
    const merchantResult = await db.update(merchants)
      .set({ isApproved: true, kycVerified: true })
      .where(eq(merchants.id, req.params.id))
      .returning();
    
    const merchant = merchantResult[0];

    res.json(merchant);
  } catch (error) {
    console.error('Approve merchant error:', error);
    res.status(500).json({ error: 'Failed to approve merchant' });
  }
});

// Reject merchant
router.post('/merchants/:id/reject', adminAuth, async (req, res) => {
  try {
    const merchantResult = await db.update(merchants)
      .set({ isApproved: false, kycVerified: false })
      .where(eq(merchants.id, req.params.id))
      .returning();
    
    const merchant = merchantResult[0];

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
    const offset = (page - 1) * limit;

    const conditions = status ? eq(transactions.status, status) : undefined;

    const transactionsResult = await db.select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: transactions.id })
      .from(transactions)
      .where(conditions);
    const total = countResult.length;

    // Get merchant and customer data
    const merchantIds = [...new Set(transactionsResult.map(t => t.merchantId).filter(Boolean))];
    const customerIds = [...new Set(transactionsResult.map(t => t.customerId).filter(Boolean))];
    
    const merchantsData = await db.select().from(merchants).where(sql`${merchants.id} = ANY(${merchantIds})`);
    const customersData = await db.select().from(customers).where(sql`${customers.id} = ANY(${customerIds})`);
    
    const merchantMap = new Map(merchantsData.map(m => [m.id, m]));
    const customerMap = new Map(customersData.map(c => [c.id, c]));

    const transactionsWithRelations = transactionsResult.map(t => ({
      ...t,
      merchant: merchantMap.get(t.merchantId),
      customer: customerMap.get(t.customerId)
    }));

    res.json({
      transactions: transactionsWithRelations,
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
    const offset = (page - 1) * limit;

    const usersResult = await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: users.id }).from(users);
    const total = countResult.length;

    res.json({
      users: usersResult,
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
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    const conditions = status ? eq(withdrawals.status, status) : undefined;

    const merchantWithdrawalsResult = await db.select()
      .from(withdrawals)
      .where(conditions)
      .orderBy(desc(withdrawals.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const customerWithdrawalsResult = await db.select()
      .from(customerWithdrawals)
      .where(conditions)
      .orderBy(desc(customerWithdrawals.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const merchantTotal = await db.select({ count: withdrawals.id }).from(withdrawals).where(conditions);
    const customerTotal = await db.select({ count: customerWithdrawals.id }).from(customerWithdrawals).where(conditions);

    // Get merchant and customer data
    const merchantIds = [...new Set(merchantWithdrawalsResult.map(w => w.merchantId).filter(Boolean))];
    const customerIds = [...new Set(customerWithdrawalsResult.map(w => w.customerId).filter(Boolean))];
    
    const merchantsData = await db.select().from(merchants).where(sql`${merchants.id} = ANY(${merchantIds})`);
    const customersData = await db.select().from(customers).where(sql`${customers.id} = ANY(${customerIds})`);
    
    const merchantMap = new Map(merchantsData.map(m => [m.id, m]));
    const customerMap = new Map(customersData.map(c => [c.id, c]));

    const merchantWithdrawalsWithUsers = merchantWithdrawalsResult.map(w => ({
      ...w,
      merchant: merchantMap.get(w.merchantId),
      type: 'merchant'
    }));

    const customerWithdrawalsWithUsers = customerWithdrawalsResult.map(w => ({
      ...w,
      customer: customerMap.get(w.customerId),
      type: 'customer'
    }));

    const allWithdrawals = [...merchantWithdrawalsWithUsers, ...customerWithdrawalsWithUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, parseInt(limit));

    res.json({
      withdrawals: allWithdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: merchantTotal.length + customerTotal.length,
        totalPages: Math.ceil((merchantTotal.length + customerTotal.length) / limit)
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
    const { status, rejectionReason, type } = req.body;
    
    if (type === 'customer') {
      const withdrawalResult = await db.update(customerWithdrawals)
        .set({
          status,
          rejectionReason,
          processedAt: new Date()
        })
        .where(eq(customerWithdrawals.id, req.params.id))
        .returning();
      
      const withdrawal = withdrawalResult[0];

      // If approved, deduct amount + fee from customer balance
      if (status === 'SUCCESSFUL') {
        const customerResult = await db.select().from(customers).where(eq(customers.id, withdrawal.customerId)).limit(1);
        const customer = customerResult[0];
        
        const totalDeduction = parseFloat(withdrawal.amount) + parseFloat(withdrawal.fee);
        
        await db.transaction(async (tx) => {
          await tx.update(customers)
            .set({ balance: (parseFloat(customer.balance) - totalDeduction).toString() })
            .where(eq(customers.id, withdrawal.customerId));
          
          // Record admin fee
          await tx.insert(adminFees).values({
            type: 'CUSTOMER_WITHDRAWAL',
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            currency: 'SLE',
            referenceId: withdrawal.id
          });
        });
      }

      // Notify customer
      if (global.io) {
        global.io.to(withdrawal.customerId).emit('withdrawal_processed', {
          withdrawalId: withdrawal.id,
          status,
          rejectionReason
        });
      }

      return res.json(withdrawal);
    } else {
      const withdrawalResult = await db.update(withdrawals)
        .set({
          status,
          rejectionReason,
          processedAt: new Date()
        })
        .where(eq(withdrawals.id, req.params.id))
        .returning();
      
      const withdrawal = withdrawalResult[0];

      // If approved, record admin fee
      if (status === 'SUCCESSFUL') {
        await db.insert(adminFees).values({
          type: 'MERCHANT_WITHDRAWAL',
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          currency: 'SLE',
          referenceId: withdrawal.id
        });
      }
      
      // Notify merchant
      if (global.io) {
        global.io.to(withdrawal.merchantId).emit('withdrawal_processed', {
          withdrawalId: withdrawal.id,
          status,
          rejectionReason
        });
      }

      return res.json(withdrawal);
    }
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get disputes
router.get('/disputes', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const disputesResult = await db.select()
      .from(disputes)
      .orderBy(desc(disputes.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: disputes.id }).from(disputes);
    const total = countResult.length;

    res.json({
      disputes: disputesResult,
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

// Get admin fees
router.get('/fees', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (type) conditions.push(eq(adminFees.type, type));
    if (startDate || endDate) {
      const dateConditions = [];
      if (startDate) dateConditions.push(gte(adminFees.createdAt, new Date(startDate)));
      if (endDate) dateConditions.push(lte(adminFees.createdAt, new Date(endDate)));
      if (dateConditions.length > 0) conditions.push(and(...dateConditions));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const feesResult = await db.select()
      .from(adminFees)
      .where(whereClause)
      .orderBy(desc(adminFees.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: adminFees.id })
      .from(adminFees)
      .where(whereClause);
    const total = countResult.length;

    // Calculate totals by type
    const allFees = await db.select().from(adminFees).where(whereClause);
    const typeTotals = allFees.reduce((acc, fee) => {
      acc[fee.type] = (acc[fee.type] || 0) + parseFloat(fee.fee);
      return acc;
    }, {});

    res.json({
      fees: feesResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      typeTotals,
      totalFees: Object.values(typeTotals).reduce((sum, val) => sum + val, 0)
    });
  } catch (error) {
    console.error('Get admin fees error:', error);
    res.status(500).json({ error: 'Failed to get admin fees' });
  }
});

module.exports = router;
