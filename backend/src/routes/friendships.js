const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and, or, desc, not } = require('drizzle-orm');
const { friendships, customers, contacts } = require('../db/schema');

const router = express.Router();

// Send friend request
router.post('/request', customerAuth, async (req, res) => {
  try {
    const { contactId, customerId } = req.body;

    if (!contactId && !customerId) {
      return res.status(400).json({ error: 'Contact ID or Customer ID is required' });
    }

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const sender = customerResult[0];

    if (!sender) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let receiverCustomerId;

    // If customerId is provided directly (from All PayMi Users view)
    if (customerId) {
      receiverCustomerId = customerId;
    } else {
      // If contactId is provided (from synced contacts view)
      const contactResult = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
      const contact = contactResult[0];

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      if (!contact.isPayMiUser || !contact.matchedCustomerId) {
        return res.status(400).json({ error: 'This contact is not a PayMi user' });
      }

      receiverCustomerId = contact.matchedCustomerId;
    }

    if (receiverCustomerId === sender.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await db.select().from(friendships).where(
      or(
        and(
          eq(friendships.requesterId, sender.id),
          eq(friendships.receiverId, receiverCustomerId)
        ),
        and(
          eq(friendships.requesterId, receiverCustomerId),
          eq(friendships.receiverId, sender.id)
        )
      )
    ).limit(1);

    if (existingFriendship.length > 0) {
      return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
    }

    // Create friend request
    const friendshipResult = await db.insert(friendships).values({
      requesterId: sender.id,
      receiverId: receiverCustomerId,
      status: 'PENDING'
    }).returning();

    console.log('Friend request created:', {
      requesterId: sender.id,
      receiverId: receiverCustomerId,
      friendship: friendshipResult[0]
    });

    res.json({
      message: 'Friend request sent successfully',
      friendship: friendshipResult[0]
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const friendshipResult = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    const friendship = friendshipResult[0];

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.receiverId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({ error: 'Friend request is not pending' });
    }

    // Update friendship status to ACCEPTED
    const updatedFriendship = await db.update(friendships)
      .set({ status: 'ACCEPTED', updatedAt: new Date() })
      .where(eq(friendships.id, id))
      .returning();

    res.json({
      message: 'Friend request accepted',
      friendship: updatedFriendship[0]
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/reject/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const friendshipResult = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    const friendship = friendshipResult[0];

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.receiverId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({ error: 'Friend request is not pending' });
    }

    // Update friendship status to REJECTED
    const updatedFriendship = await db.update(friendships)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(eq(friendships.id, id))
      .returning();

    res.json({
      message: 'Friend request rejected',
      friendship: updatedFriendship[0]
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Cancel friend request (DELETE)
router.delete('/request/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const friendshipResult = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    const friendship = friendshipResult[0];

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.requesterId !== customer.id) {
      return res.status(403).json({ error: 'Access denied. You can only cancel your own requests.' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    // Delete the friendship
    await db.delete(friendships).where(eq(friendships.id, id));

    res.json({ message: 'Friend request cancelled successfully' });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

// Get friend requests (received)
router.get('/requests', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    console.log('Getting friend requests for customer:', customer.id);

    const requests = await db.select({
      friendship: friendships,
      requester: {
        id: customers.id,
        name: customers.name,
        profilePicture: customers.profilePicture
      }
    })
    .from(friendships)
    .innerJoin(customers, eq(friendships.requesterId, customers.id))
    .where(and(
      eq(friendships.receiverId, customer.id),
      eq(friendships.status, 'PENDING')
    ))
    .orderBy(desc(friendships.createdAt));

    console.log('Friend requests found:', requests.length);

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Get friends list
router.get('/', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const friends = await db.select({
      friendship: friendships,
      friend: {
        id: customers.id,
        name: customers.name,
        profilePicture: customers.profilePicture
      }
    })
    .from(friendships)
    .innerJoin(customers, or(
      eq(friendships.requesterId, customers.id),
      eq(friendships.receiverId, customers.id)
    ))
    .where(and(
      eq(friendships.status, 'ACCEPTED'),
      or(
        eq(friendships.requesterId, customer.id),
        eq(friendships.receiverId, customer.id)
      ),
      not(eq(customers.id, customer.id))
    ))
    .orderBy(desc(friendships.updatedAt));

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Block/unblock friend
router.post('/block/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const friendshipResult = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    const friendship = friendshipResult[0];

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    if (friendship.requesterId !== customer.id && friendship.receiverId !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update friendship status to BLOCKED
    const updatedFriendship = await db.update(friendships)
      .set({ status: 'BLOCKED', updatedAt: new Date() })
      .where(eq(friendships.id, id))
      .returning();

    res.json({
      message: 'Friend blocked',
      friendship: updatedFriendship[0]
    });
  } catch (error) {
    console.error('Block friend error:', error);
    res.status(500).json({ error: 'Failed to block friend' });
  }
});

module.exports = router;
