const express = require('express');
const router = express.Router();
const webpush = require('web-push');

// Configure web-push with VAPID keys only if they're properly configured
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicVapidKey,
    privateVapidKey
  );
}

/**
 * Get VAPID public key
 * GET /api/push-notifications/vapid-public-key
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

/**
 * Subscribe to push notifications
 * POST /api/push-notifications/subscribe
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription object is required' });
    }

    // In a real app, you would save this to the database
    // For now, just return success
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/push-notifications/unsubscribe
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription object is required' });
    }

    // In a real app, you would remove this from the database
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Send test notification
 * POST /api/push-notifications/test
 */
router.post('/test', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription object is required' });
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test notification from PayMi',
      icon: '/icon.png'
    });

    await webpush.sendNotification(subscription, payload);
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
