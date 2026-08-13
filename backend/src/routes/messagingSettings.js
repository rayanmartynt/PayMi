const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { messagingSettings, customers } = require('../db/schema');

const router = express.Router();

// Get messaging settings
router.get('/', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let settings = await db.select().from(messagingSettings).where(eq(messagingSettings.customerId, customer.id)).limit(1);

    if (settings.length === 0) {
      // Create default settings
      const newSettings = await db.insert(messagingSettings).values({
        customerId: customer.id,
        readReceiptsEnabled: true,
        onlineStatusEnabled: true,
        typingIndicatorsEnabled: true
      }).returning();
      settings = newSettings;
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('Get messaging settings error:', error);
    res.status(500).json({ error: 'Failed to get messaging settings' });
  }
});

// Update messaging settings
router.put('/', customerAuth, async (req, res) => {
  try {
    const { readReceiptsEnabled, onlineStatusEnabled, typingIndicatorsEnabled } = req.body;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updateData = {};
    if (readReceiptsEnabled !== undefined) updateData.readReceiptsEnabled = readReceiptsEnabled;
    if (onlineStatusEnabled !== undefined) updateData.onlineStatusEnabled = onlineStatusEnabled;
    if (typingIndicatorsEnabled !== undefined) updateData.typingIndicatorsEnabled = typingIndicatorsEnabled;
    updateData.updatedAt = new Date();

    let settings = await db.select().from(messagingSettings).where(eq(messagingSettings.customerId, customer.id)).limit(1);

    if (settings.length === 0) {
      // Create settings if they don't exist
      const newSettings = await db.insert(messagingSettings).values({
        customerId: customer.id,
        readReceiptsEnabled: readReceiptsEnabled ?? true,
        onlineStatusEnabled: onlineStatusEnabled ?? true,
        typingIndicatorsEnabled: typingIndicatorsEnabled ?? true,
        ...updateData
      }).returning();
      settings = newSettings;
    } else {
      // Update existing settings
      const updatedSettings = await db.update(messagingSettings)
        .set(updateData)
        .where(eq(messagingSettings.customerId, customer.id))
        .returning();
      settings = updatedSettings;
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('Update messaging settings error:', error);
    res.status(500).json({ error: 'Failed to update messaging settings' });
  }
});

module.exports = router;
