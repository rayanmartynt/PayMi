const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { notifications } = require('../db/schema');

const router = express.Router();

// Get notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = eq(notifications.userId, req.user.id);
    if (unreadOnly === 'true') {
      whereCondition = and(eq(notifications.userId, req.user.id), eq(notifications.read, false));
    }

    const notificationsResult = await db.select()
      .from(notifications)
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const total = notificationsResult.length;

    res.json({
      notifications: notificationsResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const updatedNotificationResult = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, req.params.id))
      .returning();
    
    const notification = updatedNotificationResult[0];

    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, req.user.id), eq(notifications.read, false)));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.delete(notifications).where(eq(notifications.id, req.params.id));

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
