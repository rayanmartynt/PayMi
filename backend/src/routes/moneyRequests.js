const express = require('express');
const { customerAuth, requireFullVerification } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and, or, desc } = require('drizzle-orm');
const { moneyRequests, customers, friendships } = require('../db/schema');

const router = express.Router();

// Create money request
router.post('/', customerAuth, requireFullVerification, async (req, res) => {
  try {
    const { receiverId, amount, description, expiresIn } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check if requester and receiver are friends
    const friendship = await db.select().from(friendships).where(
      and(
        eq(friendships.requesterId, req.customer.id),
        eq(friendships.receiverId, receiverId),
        eq(friendships.status, 'ACCEPTED')
      )
    ).limit(1);

    if (friendship.length === 0) {
      return res.status(400).json({ error: 'You can only request money from friends' });
    }

    // Check if receiver exists
    const receiver = await db.select().from(customers).where(eq(customers.id, receiverId)).limit(1);
    if (receiver.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Calculate expiration date
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000 * 60 * 60 * 24) : null;

    // Create money request
    const newRequest = await db.insert(moneyRequests).values({
      requesterId: req.customer.id,
      receiverId,
      amount: amount.toString(),
      currency: 'SLE',
      description,
      status: 'PENDING',
      expiresAt
    }).returning();

    res.json({
      message: 'Money request created successfully',
      moneyRequest: newRequest[0]
    });
  } catch (error) {
    console.error('Create money request error:', error);
    res.status(500).json({ error: 'Failed to create money request' });
  }
});

// Get received money requests
router.get('/received', customerAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let query = eq(moneyRequests.receiverId, req.customer.id);
    if (status) {
      query = and(query, eq(moneyRequests.status, status));
    }

    const requests = await db.select()
      .from(moneyRequests)
      .where(query)
      .orderBy(desc(moneyRequests.createdAt));

    // Get requester details for each request
    const requestWithDetails = await Promise.all(
      requests.map(async (request) => {
        const requester = await db.select().from(customers).where(eq(customers.id, request.requesterId)).limit(1);
        return {
          ...request,
          requester: requester[0] || null
        };
      })
    );

    res.json(requestWithDetails);
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: 'Failed to get received requests' });
  }
});

// Get sent money requests
router.get('/sent', customerAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let query = eq(moneyRequests.requesterId, req.customer.id);
    if (status) {
      query = and(query, eq(moneyRequests.status, status));
    }

    const requests = await db.select()
      .from(moneyRequests)
      .where(query)
      .orderBy(desc(moneyRequests.createdAt));

    // Get receiver details for each request
    const requestWithDetails = await Promise.all(
      requests.map(async (request) => {
        const receiver = await db.select().from(customers).where(eq(customers.id, request.receiverId)).limit(1);
        return {
          ...request,
          receiver: receiver[0] || null
        };
      })
    );

    res.json(requestWithDetails);
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
});

// Accept money request (creates a transfer)
router.post('/:id/accept', customerAuth, requireFullVerification, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the money request
    const requestResult = await db.select().from(moneyRequests).where(eq(moneyRequests.id, id)).limit(1);
    const request = requestResult[0];

    if (!request) {
      return res.status(404).json({ error: 'Money request not found' });
    }

    // Verify the current user is the receiver
    if (request.receiverId !== req.customer.id) {
      return res.status(403).json({ error: 'You can only accept requests sent to you' });
    }

    // Check if request is still pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request is no longer pending' });
    }

    // Check if request has expired
    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      await db.update(moneyRequests)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(moneyRequests.id, id));
      return res.status(400).json({ error: 'This request has expired' });
    }

    // Check if sender has sufficient balance
    if (parseFloat(req.customer.balance) < parseFloat(request.amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transfer (using the friend transfer route logic)
    const customerTransfers = require('./customerTransfers');
    const transfer = await customerTransfers.sendToFriend(req.customer.id, request.requesterId, parseFloat(request.amount), request.description || 'Money request payment');

    // Update money request status
    const updatedRequest = await db.update(moneyRequests)
      .set({ 
        status: 'ACCEPTED', 
        acceptedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(moneyRequests.id, id))
      .returning();

    res.json({
      message: 'Money request accepted and transfer completed',
      moneyRequest: updatedRequest[0],
      transfer
    });
  } catch (error) {
    console.error('Accept money request error:', error);
    res.status(500).json({ error: 'Failed to accept money request' });
  }
});

// Reject money request
router.post('/:id/reject', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the money request
    const requestResult = await db.select().from(moneyRequests).where(eq(moneyRequests.id, id)).limit(1);
    const request = requestResult[0];

    if (!request) {
      return res.status(404).json({ error: 'Money request not found' });
    }

    // Verify the current user is the receiver
    if (request.receiverId !== req.customer.id) {
      return res.status(403).json({ error: 'You can only reject requests sent to you' });
    }

    // Check if request is still pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request is no longer pending' });
    }

    // Update money request status
    const updatedRequest = await db.update(moneyRequests)
      .set({ 
        status: 'REJECTED', 
        rejectedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(moneyRequests.id, id))
      .returning();

    res.json({
      message: 'Money request rejected',
      moneyRequest: updatedRequest[0]
    });
  } catch (error) {
    console.error('Reject money request error:', error);
    res.status(500).json({ error: 'Failed to reject money request' });
  }
});

// Cancel money request (by requester)
router.post('/:id/cancel', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the money request
    const requestResult = await db.select().from(moneyRequests).where(eq(moneyRequests.id, id)).limit(1);
    const request = requestResult[0];

    if (!request) {
      return res.status(404).json({ error: 'Money request not found' });
    }

    // Verify the current user is the requester
    if (request.requesterId !== req.customer.id) {
      return res.status(403).json({ error: 'You can only cancel your own requests' });
    }

    // Check if request is still pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request can no longer be cancelled' });
    }

    // Update money request status
    const updatedRequest = await db.update(moneyRequests)
      .set({ 
        status: 'CANCELLED',
        updatedAt: new Date() 
      })
      .where(eq(moneyRequests.id, id))
      .returning();

    res.json({
      message: 'Money request cancelled',
      moneyRequest: updatedRequest[0]
    });
  } catch (error) {
    console.error('Cancel money request error:', error);
    res.status(500).json({ error: 'Failed to cancel money request' });
  }
});

// Get specific money request
router.get('/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const requestResult = await db.select().from(moneyRequests).where(eq(moneyRequests.id, id)).limit(1);
    const request = requestResult[0];

    if (!request) {
      return res.status(404).json({ error: 'Money request not found' });
    }

    // Verify the current user is either requester or receiver
    if (request.requesterId !== req.customer.id && request.receiverId !== req.customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get both requester and receiver details
    const [requester, receiver] = await Promise.all([
      db.select().from(customers).where(eq(customers.id, request.requesterId)).limit(1),
      db.select().from(customers).where(eq(customers.id, request.receiverId)).limit(1)
    ]);

    res.json({
      ...request,
      requester: requester[0] || null,
      receiver: receiver[0] || null
    });
  } catch (error) {
    console.error('Get money request error:', error);
    res.status(500).json({ error: 'Failed to get money request' });
  }
});

module.exports = router;
