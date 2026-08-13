const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and, or, desc, like, ne } = require('drizzle-orm');
const { contacts, customers, users } = require('../db/schema');
const smsService = require('../services/sms');

const router = express.Router();

// Sync contacts from phone
router.post('/sync', customerAuth, async (req, res) => {
  try {
    const { contacts: phoneContacts } = req.body;
    
    if (!Array.isArray(phoneContacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete existing contacts for this user
    await db.delete(contacts).where(eq(contacts.userId, req.user.id));

    const syncedContacts = [];

    // Process each contact
    for (const contact of phoneContacts) {
      const { name, phoneNumber } = contact;
      
      if (!name || !phoneNumber) {
        continue; // Skip invalid contacts
      }

      // Format phone number
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      // Check if this phone number belongs to a PayMi customer
      const userResult = await db.select().from(users).where(eq(users.phoneNumber, formattedPhone)).limit(1);
      const matchedUser = userResult[0];

      let matchedCustomerId = null;
      let isPayMiUser = false;

      if (matchedUser) {
        const customerMatchResult = await db.select().from(customers).where(eq(customers.userId, matchedUser.id)).limit(1);
        const matchedCustomer = customerMatchResult[0];
        
        if (matchedCustomer) {
          matchedCustomerId = matchedCustomer.id;
          isPayMiUser = true;
        }
      }

      // Insert contact
      const contactResult = await db.insert(contacts).values({
        userId: req.user.id,
        name,
        phoneNumber: formattedPhone,
        isPayMiUser,
        matchedCustomerId
      }).returning();

      syncedContacts.push(contactResult[0]);
    }

    res.json({
      message: 'Contacts synced successfully',
      contacts: syncedContacts,
      total: syncedContacts.length,
      payMiUsers: syncedContacts.filter(c => c.isPayMiUser).length
    });
  } catch (error) {
    console.error('Sync contacts error:', error);
    res.status(500).json({ error: 'Failed to sync contacts' });
  }
});

// Get all PayMi users
router.get('/paymi-users', customerAuth, async (req, res) => {
  try {
    const { search } = req.query;

    // Get all customers with their user information, excluding current user
    let query = db.select({
      id: customers.id,
      userId: customers.userId,
      name: users.name,
      phoneNumber: users.phoneNumber,
      email: users.email,
      createdAt: customers.createdAt
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(ne(customers.userId, req.user.id)); // Exclude current user

    // Apply search filter if provided
    if (search) {
      query = query.where(and(
        ne(customers.userId, req.user.id),
        or(
          like(users.name, `%${search}%`),
          like(users.phoneNumber, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      ));
    }

    const paymiUsers = await query
      .orderBy(desc(customers.createdAt))
      .limit(50); // Limit to 50 users for performance

    res.json(paymiUsers);
  } catch (error) {
    console.error('Get PayMi users error:', error);
    res.status(500).json({ error: 'Failed to get PayMi users' });
  }
});

// Get synced contacts
router.get('/', customerAuth, async (req, res) => {
  try {
    const { onlyPayMiUsers } = req.query;

    let contactsResult;
    
    if (onlyPayMiUsers === 'true') {
      contactsResult = await db.select()
        .from(contacts)
        .where(and(
          eq(contacts.userId, req.user.id),
          eq(contacts.isPayMiUser, true)
        ))
        .orderBy(desc(contacts.createdAt));
    } else {
      contactsResult = await db.select()
        .from(contacts)
        .where(eq(contacts.userId, req.user.id))
        .orderBy(desc(contacts.createdAt));
    }

    res.json(contactsResult);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Delete a contact
router.delete('/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const contactResult = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    const contact = contactResult[0];

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.delete(contacts).where(eq(contacts.id, id));

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
