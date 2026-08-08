const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and, or, desc, asc } = require('drizzle-orm');
const { chats, messages, customers, friendships, users } = require('../db/schema');
const { generateUserKey, deriveSharedKey, encryptMessage, decryptMessage } = require('../services/encryption');

const router = express.Router();

// Get or create user's encryption key
async function getUserEncryptionKey(customerId) {
  const userResult = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
  const user = userResult[0];
  
  if (!user.encryptionKey) {
    const newKey = generateUserKey();
    await db.update(users)
      .set({ encryptionKey: newKey })
      .where(eq(users.id, customerId));
    return newKey;
  }
  
  return user.encryptionKey;
}

// Get or create chat between two customers
router.get('/with/:friendId', customerAuth, async (req, res) => {
  try {
    const { friendId } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if they are friends
    const friendship = await db.select().from(friendships).where(
      and(
        eq(friendships.status, 'ACCEPTED'),
        or(
          and(
            eq(friendships.requesterId, customer.id),
            eq(friendships.receiverId, friendId)
          ),
          and(
            eq(friendships.requesterId, friendId),
            eq(friendships.receiverId, customer.id)
          )
        )
      )
    ).limit(1);

    if (friendship.length === 0) {
      return res.status(403).json({ error: 'You are not friends with this user' });
    }

    // Find existing chat
    let chat = await db.select().from(chats).where(
      or(
        and(
          eq(chats.participant1Id, customer.id),
          eq(chats.participant2Id, friendId)
        ),
        and(
          eq(chats.participant1Id, friendId),
          eq(chats.participant2Id, customer.id)
        )
      )
    ).limit(1);

    if (chat.length === 0) {
      // Create new chat
      const newChat = await db.insert(chats).values({
        participant1Id: customer.id,
        participant2Id: friendId
      }).returning();
      chat = newChat;
    }

    res.json(chat[0]);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Get all chats for current user
router.get('/', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const userChats = await db.select({
      chat: chats,
      otherParticipant: {
        id: customers.id,
        name: customers.name,
        profilePicture: customers.profilePicture
      }
    })
    .from(chats)
    .innerJoin(customers, or(
      eq(chats.participant1Id, customers.id),
      eq(chats.participant2Id, customers.id)
    ))
    .where(and(
      or(
        eq(chats.participant1Id, customer.id),
        eq(chats.participant2Id, customer.id)
      ),
      not(eq(customers.id, customer.id))
    ))
    .orderBy(desc(chats.lastMessageAt));

    res.json(userChats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Send message
router.post('/:chatId/messages', customerAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user is part of this chat
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (chat.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat[0].participant1Id !== customer.id && chat[0].participant2Id !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get both users' encryption keys
    const senderKey = await getUserEncryptionKey(customer.id);
    const receiverId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    const receiverKey = await getUserEncryptionKey(receiverId);

    // Derive shared key
    const sharedKey = deriveSharedKey(senderKey, receiverKey);

    // Encrypt message
    const { encryptedContent, iv } = encryptMessage(content, sharedKey);

    // Insert message
    const message = await db.insert(messages).values({
      chatId,
      senderId: customer.id,
      encryptedContent,
      iv,
      read: false
    }).returning();

    // Update chat's last message time
    await db.update(chats)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    res.json({
      message: message[0],
      decryptedContent: content // Return decrypted content for sender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', customerAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user is part of this chat
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (chat.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat[0].participant1Id !== customer.id && chat[0].participant2Id !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const messagesList = await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get user's encryption key
    const userKey = await getUserEncryptionKey(customer.id);
    const otherParticipantId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    const otherParticipantKey = await getUserEncryptionKey(otherParticipantId);

    // Derive shared key
    const sharedKey = deriveSharedKey(userKey, otherParticipantKey);

    // Decrypt messages
    const decryptedMessages = messagesList.map(msg => ({
      ...msg,
      content: decryptMessage(msg.encryptedContent, msg.iv, sharedKey)
    }));

    // Mark messages as read if they are from the other participant
    const unreadMessages = messagesList.filter(m => m.senderId !== customer.id && !m.read);
    if (unreadMessages.length > 0) {
      await db.update(messages)
        .set({ read: true })
        .where(and(
          eq(messages.chatId, chatId),
          eq(messages.senderId, chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id),
          eq(messages.read, false)
        ));
    }

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Mark messages as read
router.post('/:chatId/read', customerAuth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user is part of this chat
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (chat.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat[0].participant1Id !== customer.id && chat[0].participant2Id !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages as read
    await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.chatId, chatId),
        eq(messages.senderId, chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id),
        eq(messages.read, false)
      ));

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;
