const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and, ne } = require('drizzle-orm');
const { users, adminFees, adminBankAccounts, adminWithdrawals } = require('../db/schema');

const router = express.Router();

// Get admin balance
router.get('/balance', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = userResult[0];

    res.json({
      balance: user.adminBalance || '0',
      currency: 'SLE'
    });
  } catch (error) {
    console.error('Get admin balance error:', error);
    res.status(500).json({ error: 'Failed to get admin balance' });
  }
});

// Get admin fees history
router.get('/history', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 20, type, isCollected } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (type) {
      conditions.push(eq(adminFees.type, type));
    }
    if (isCollected !== undefined) {
      conditions.push(eq(adminFees.isCollected, isCollected === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const feesResult = await db.select()
      .from(adminFees)
      .where(whereClause)
      .orderBy(desc(adminFees.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: adminFees.id })
      .from(adminFees)
      .where(whereClause);

    res.json({
      fees: feesResult,
      total: countResult.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get admin fees history error:', error);
    res.status(500).json({ error: 'Failed to get admin fees history' });
  }
});

// Get admin bank accounts
router.get('/bank-accounts', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const accountsResult = await db.select()
      .from(adminBankAccounts)
      .where(eq(adminBankAccounts.userId, req.user.id))
      .orderBy(desc(adminBankAccounts.isDefault), desc(adminBankAccounts.createdAt));

    res.json(accountsResult);
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ error: 'Failed to get bank accounts' });
  }
});

// Add bank account
router.post('/bank-accounts', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { bankName, accountNumber, accountName, isDefault } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Bank name, account number, and account name are required' });
    }

    // If this is the first account or set as default, remove default from others
    if (isDefault) {
      await db.update(adminBankAccounts)
        .set({ isDefault: false })
        .where(and(eq(adminBankAccounts.userId, req.user.id), ne(adminBankAccounts.id, '00000000-0000-0000-0000-000000000000')));
    }

    const accountResult = await db.insert(adminBankAccounts).values({
      userId: req.user.id,
      bankName,
      accountNumber,
      accountName,
      isDefault: isDefault || false
    }).returning();

    res.json(accountResult[0]);
  } catch (error) {
    console.error('Add bank account error:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// Delete bank account
router.delete('/bank-accounts/:id', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const accountResult = await db.select()
      .from(adminBankAccounts)
      .where(and(eq(adminBankAccounts.id, req.params.id), eq(adminBankAccounts.userId, req.user.id)))
      .limit(1);

    const account = accountResult[0];

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    await db.delete(adminBankAccounts).where(eq(adminBankAccounts.id, req.params.id));

    res.json({ message: 'Bank account deleted' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// Set default bank account
router.post('/bank-accounts/:id/default', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const accountResult = await db.select()
      .from(adminBankAccounts)
      .where(and(eq(adminBankAccounts.id, req.params.id), eq(adminBankAccounts.userId, req.user.id)))
      .limit(1);

    const account = accountResult[0];

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // Remove default from all other accounts
    await db.update(adminBankAccounts)
      .set({ isDefault: false })
      .where(and(eq(adminBankAccounts.userId, req.user.id), ne(adminBankAccounts.id, req.params.id)));

    // Set this one as default
    await db.update(adminBankAccounts)
      .set({ isDefault: true })
      .where(eq(adminBankAccounts.id, req.params.id));

    res.json({ message: 'Default bank account updated' });
  } catch (error) {
    console.error('Set default bank account error:', error);
    res.status(500).json({ error: 'Failed to set default bank account' });
  }
});

// Create withdrawal request
router.post('/withdrawals', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { amount, bankAccountId } = req.body;

    if (!amount || !bankAccountId) {
      return res.status(400).json({ error: 'Amount and bank account are required' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = userResult[0];

    const withdrawalAmount = parseFloat(amount);
    const currentBalance = parseFloat(user.adminBalance || 0);

    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (withdrawalAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Verify bank account belongs to user
    const bankAccountResult = await db.select()
      .from(adminBankAccounts)
      .where(and(eq(adminBankAccounts.id, bankAccountId), eq(adminBankAccounts.userId, req.user.id)))
      .limit(1);

    const bankAccount = bankAccountResult[0];

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // Deduct from admin balance
    await db.update(users)
      .set({ adminBalance: (currentBalance - withdrawalAmount).toString() })
      .where(eq(users.id, req.user.id));

    // Create withdrawal record
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const withdrawalResult = await db.insert(adminWithdrawals).values({
      userId: req.user.id,
      amount: amount.toString(),
      currency: 'SLE',
      bankAccountId,
      status: 'PENDING',
      reference
    }).returning();

    res.json(withdrawalResult[0]);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// Get withdrawals history
router.get('/withdrawals', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [eq(adminWithdrawals.userId, req.user.id)];
    if (status) {
      conditions.push(eq(adminWithdrawals.status, status));
    }

    const whereClause = and(...conditions);

    const withdrawalsResult = await db.select()
      .from(adminWithdrawals)
      .where(whereClause)
      .orderBy(desc(adminWithdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: adminWithdrawals.id })
      .from(adminWithdrawals)
      .where(whereClause);

    res.json({
      withdrawals: withdrawalsResult,
      total: countResult.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// Process withdrawal (admin action to approve/reject)
router.post('/withdrawals/:id/process', auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const withdrawalResult = await db.select()
      .from(adminWithdrawals)
      .where(eq(adminWithdrawals.id, req.params.id))
      .limit(1);

    const withdrawal = withdrawalResult[0];

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }

    const updateData = {
      status,
      processedAt: new Date()
    };

    // If rejected, refund the amount back to admin balance
    if (status === 'REJECTED') {
      const userResult = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
      const user = userResult[0];
      
      await db.update(users)
        .set({ adminBalance: (parseFloat(user.adminBalance || 0) + parseFloat(withdrawal.amount)).toString() })
        .where(eq(users.id, withdrawal.userId));
    }

    await db.update(adminWithdrawals)
      .set(updateData)
      .where(eq(adminWithdrawals.id, req.params.id));

    res.json({ message: `Withdrawal ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

module.exports = router;
