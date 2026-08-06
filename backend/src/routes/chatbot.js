const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbot');
const { auth } = require('../middleware/auth');

/**
 * Get chatbot response
 * POST /api/chatbot/message
 */
router.post('/message', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = chatbotService.getResponse(message);

    res.json({
      message: response,
      suggestions: chatbotService.getSuggestions()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Get chat suggestions
 * GET /api/chatbot/suggestions
 */
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = chatbotService.getSuggestions();
    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * Chat health check
 * GET /api/chatbot/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PayMi Chatbot' });
});

module.exports = router;
