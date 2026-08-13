const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { getSocketIO } = require('../socket');
const { customers, users, chats, messages, transactions, auditLogs, friendships, messagingSettings, messageReactions } = require('../db/schema');
const { eq, and, or, desc, asc, isNull, ne, sql } = require('drizzle-orm');
const { generateUserKey, deriveSharedKey, encryptMessage, decryptMessage } = require('../services/encryption');
const { createAuditLog } = require('../services/auditLog');
const { setMessageDelivered, setMessageRead, getUserStatus, getMultipleUserStatuses } = require('../db/redis');

const router = express.Router();

// Helper to get io instance
const getIo = () => {
  const io = getSocketIO();
  if (!io) {
    console.warn('Socket.io not initialized');
    return null;
  }
  return io;
};

// Get or create user's encryption key
async function getUserEncryptionKey(customerId) {
  const customerResult = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const customer = customerResult[0];
  
  if (!customer || !customer.userId) {
    throw new Error('Customer not found or has no associated user');
  }
  
  const userResult = await db.select().from(users).where(eq(users.id, customer.userId)).limit(1);
  const user = userResult[0];
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.encryptionKey) {
    const newKey = generateUserKey();
    // Store as JSON string with privateKey and publicKey
    await db.update(users)
      .set({ encryptionKey: JSON.stringify(newKey) })
      .where(eq(users.id, customer.userId));
    return newKey;
  }
  
  // Parse existing key (handle both old format and new JSON format)
  try {
    const parsedKey = JSON.parse(user.encryptionKey);
    if (parsedKey.privateKey && parsedKey.publicKey) {
      return parsedKey;
    }
  } catch (e) {
    // Old format - single hex string, migrate to new format
    const newKey = generateUserKey();
    await db.update(users)
      .set({ encryptionKey: JSON.stringify(newKey) })
      .where(eq(users.id, customer.userId));
    return newKey;
  }
  
  // Fallback - generate new key if parsing failed
  const newKey = generateUserKey();
  await db.update(users)
    .set({ encryptionKey: JSON.stringify(newKey) })
    .where(eq(users.id, customer.userId));
  return newKey;
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
        participant2Id: friendId,
        type: 'customer'
      }).returning();
      chat = newChat;
      
      // Audit log for conversation creation
      await createAuditLog(
        'CONVERSATION_CREATED',
        req.user.id,
        'CUSTOMER',
        { chatId: chat[0].id, participantId: friendId },
        req.ip,
        req.get('user-agent')
      );
    }

    res.json(chat[0]);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Get or create support chat
router.get('/support', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find existing support chat
    let chat = await db.select().from(chats).where(
      and(
        eq(chats.participant1Id, customer.id),
        eq(chats.type, 'support')
      )
    ).limit(1);

    if (chat.length === 0) {
      // Create new support chat
      const newChat = await db.insert(chats).values({
        participant1Id: customer.id,
        participant2Id: null,
        type: 'support'
      }).returning();
      chat = newChat;
      
      // Audit log for support conversation creation
      await createAuditLog(
        'CONVERSATION_CREATED',
        req.user.id,
        'CUSTOMER',
        { chatId: chat[0].id, type: 'support' },
        req.ip,
        req.get('user-agent')
      );
    }

    res.json(chat[0]);
  } catch (error) {
    console.error('Get support chat error:', error);
    res.status(500).json({ error: 'Failed to get support chat' });
  }
});

// Get or create payment conversation
router.get('/payment/:transactionId', customerAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify transaction exists and belongs to customer
    const transaction = await db.select().from(transactions).where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.customerId, customer.id)
      )
    ).limit(1);

    if (transaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Find existing payment conversation
    let chat = await db.select().from(chats).where(
      and(
        eq(chats.transactionId, transactionId),
        eq(chats.type, 'payment')
      )
    ).limit(1);

    if (chat.length === 0) {
      // Create new payment conversation
      const newChat = await db.insert(chats).values({
        participant1Id: customer.id,
        participant2Id: null,
        type: 'payment',
        transactionId
      }).returning();
      chat = newChat;
      
      // Audit log for payment conversation creation
      await createAuditLog(
        'CONVERSATION_CREATED',
        req.user.id,
        'CUSTOMER',
        { chatId: chat[0].id, type: 'payment', transactionId },
        req.ip,
        req.get('user-agent')
      );
    }

    res.json(chat[0]);
  } catch (error) {
    console.error('Get payment conversation error:', error);
    res.status(500).json({ error: 'Failed to get payment conversation' });
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
        profilePicture: customers.profilePicture,
        userId: customers.userId
      }
    })
    .from(chats)
    .leftJoin(customers, and(
      or(
        and(
          eq(chats.participant1Id, customer.id),
          eq(chats.participant2Id, customers.id)
        ),
        and(
          eq(chats.participant2Id, customer.id),
          eq(chats.participant1Id, customers.id)
        )
      ),
      // Ensure we're getting the OTHER participant, not the current customer
      ne(customers.id, customer.id)
    ))
    .where(and(
      or(
        eq(chats.participant1Id, customer.id),
        eq(chats.participant2Id, customer.id)
      ),
      or(
        eq(chats.type, 'customer'),
        eq(chats.type, 'support')
      )
    ))
    .orderBy(desc(chats.lastMessageAt));

    // Add unread message count for each chat
    const chatsWithUnread = await Promise.all(
      userChats.map(async (chatItem) => {
        const unreadCount = await db
          .select({ count: messages.id })
          .from(messages)
          .where(and(
            eq(messages.chatId, chatItem.chat.id),
            eq(messages.read, false),
            ne(messages.senderId, customer.id)
          ))
          .then(result => result.length);

        return {
          ...chatItem,
          unreadCount
        };
      })
    );

    res.json(chatsWithUnread);
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

    if (!chatId || chatId === 'undefined') {
      return res.status(400).json({ error: 'Invalid chat ID' });
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

    // Ensure user is not sending to themselves
    const receiverId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    if (receiverId === customer.id) {
      return res.status(403).json({ error: 'Cannot send messages to yourself' });
    }

    // Get both users' encryption keys
    const senderKey = await getUserEncryptionKey(customer.id);
    
    if (!receiverId || receiverId === 'undefined') {
      return res.status(400).json({ error: 'Invalid receiver ID' });
    }
    
    const receiverKey = await getUserEncryptionKey(receiverId);

    // Derive shared key using sender's private key and receiver's public key
    const sharedKey = deriveSharedKey(senderKey.privateKey, receiverKey.publicKey);

    // Encrypt message
    const { encryptedContent, iv } = encryptMessage(content, sharedKey);

    // Insert message
    const message = await db.insert(messages).values({
      chatId,
      senderId: customer.id,
      encryptedContent,
      iv,
      read: false,
      status: 'sent'
    }).returning();

    // Update chat's last message time
    await db.update(chats)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    // Emit real-time message to receiver via Socket.io
    const io = getIo();
    if (io) {
      // Get receiver's customer to find their userId
      const receiverCustomer = await db.select().from(customers).where(eq(customers.id, receiverId)).limit(1);
      if (receiverCustomer.length > 0) {
        io.to(receiverCustomer[0].userId).emit('new_message', {
          chatId,
          messageId: message[0].id,
          senderId: customer.id,
          content,
          createdAt: message[0].createdAt
        });
        
        // Mark message as delivered in Redis if receiver is online
        const receiverStatus = await getUserStatus(receiverCustomer[0].userId);
        if (receiverStatus && receiverStatus.online) {
          await setMessageDelivered(message[0].id, receiverId);
          // Update message status in database
          await db.update(messages)
            .set({ status: 'delivered' })
            .where(eq(messages.id, message[0].id));
          
          // Emit delivery confirmation to sender
          io.to(req.user.id).emit('message_delivered', {
            messageId: message[0].id,
            chatId,
            status: 'delivered'
          });
        }
      }
    }

    // Audit log for message sent
    await createAuditLog(
      'MESSAGE_SENT',
      req.user.id,
      'CUSTOMER',
      { messageId: message[0].id, chatId, receiverId },
      req.ip,
      req.get('user-agent')
    );

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

    if (!chatId || chatId === 'undefined') {
      return res.status(400).json({ error: 'Invalid chat ID' });
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

    // Get messages (excluding soft-deleted ones)
    const messagesList = await db.select()
      .from(messages)
      .where(and(
        eq(messages.chatId, chatId),
        isNull(messages.deletedAt)
      ))
      .orderBy(asc(messages.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const otherParticipantId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    
    if (!otherParticipantId || otherParticipantId === 'undefined') {
      return res.status(400).json({ error: 'Invalid participant ID' });
    }

    // Get user's encryption key
    const userKey = await getUserEncryptionKey(customer.id);
    const otherParticipantKey = await getUserEncryptionKey(otherParticipantId);

    // Derive shared key using user's private key and other participant's public key
    const sharedKey = deriveSharedKey(userKey.privateKey, otherParticipantKey.publicKey);

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

    // Get user's messaging settings
    const settingsResult = await db.select().from(messagingSettings).where(eq(messagingSettings.customerId, customer.id)).limit(1);
    const settings = settingsResult[0] || { readReceiptsEnabled: true };

    // If read receipts are disabled, don't mark as read
    if (!settings.readReceiptsEnabled) {
      return res.json({ message: 'Read receipts disabled' });
    }

    // Mark messages as read and update status
    const otherParticipantId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    const unreadMessages = await db.select().from(messages).where(and(
      eq(messages.chatId, chatId),
      eq(messages.senderId, otherParticipantId),
      eq(messages.read, false)
    ));
    
    await db.update(messages)
      .set({ read: true, status: 'read' })
      .where(and(
        eq(messages.chatId, chatId),
        eq(messages.senderId, otherParticipantId),
        eq(messages.read, false)
      ));
    
    // Mark messages as read in Redis
    for (const msg of unreadMessages) {
      await setMessageRead(msg.id, customer.id);
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get user online status
router.get('/status/:userId', customerAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the requesting user has online status enabled for themselves
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get the target user's messaging settings
    const targetCustomer = await db.select().from(customers).where(eq(customers.id, userId)).limit(1);
    if (targetCustomer.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const settingsResult = await db.select().from(messagingSettings).where(eq(messagingSettings.customerId, targetCustomer[0].id)).limit(1);
    const settings = settingsResult[0] || { onlineStatusEnabled: true };
    
    // If the target user has disabled online status, return offline
    if (!settings.onlineStatusEnabled) {
      return res.json({
        online: false,
        lastSeen: null
      });
    }
    
    const status = await getUserStatus(userId);
    
    res.json({
      online: status ? status.online : false,
      lastSeen: status ? status.lastSeen : null
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Get multiple users' online status
router.post('/status/batch', customerAuth, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds array is required' });
    }
    
    // Get messaging settings for all users
    const customersResult = await db.select().from(customers).where(eq(customers.id, userIds[0]));
    const settingsMap = {};
    
    for (const userId of userIds) {
      const customer = await db.select().from(customers).where(eq(customers.id, userId)).limit(1);
      if (customer.length > 0) {
        const settings = await db.select().from(messagingSettings).where(eq(messagingSettings.customerId, customer[0].id)).limit(1);
        settingsMap[userId] = settings[0] || { onlineStatusEnabled: true };
      }
    }
    
    const statuses = await getMultipleUserStatuses(userIds);
    
    // Filter out online status for users who have disabled it
    const filteredStatuses = {};
    for (const userId in statuses) {
      if (settingsMap[userId] && !settingsMap[userId].onlineStatusEnabled) {
        filteredStatuses[userId] = { online: false, lastSeen: null };
      } else {
        filteredStatuses[userId] = statuses[userId];
      }
    }
    
    res.json(filteredStatuses);
  } catch (error) {
    console.error('Get batch user status error:', error);
    res.status(500).json({ error: 'Failed to get user statuses' });
  }
});

// Delete message (soft delete)
router.delete('/:chatId/messages/:messageId', customerAuth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

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

    // Verify message belongs to this chat and user is the sender
    const message = await db.select().from(messages).where(
      and(
        eq(messages.id, messageId),
        eq(messages.chatId, chatId),
        eq(messages.senderId, customer.id)
      )
    ).limit(1);

    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Soft delete the message
    await db.update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));

    // Emit deletion event to other participant
    const io = getIo();
    if (io) {
      const otherParticipantId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
      const otherCustomer = await db.select().from(customers).where(eq(customers.id, otherParticipantId)).limit(1);
      if (otherCustomer.length > 0) {
        io.to(otherCustomer[0].userId).emit('message_deleted', {
          messageId,
          chatId
        });
      }
    }

    // Audit log for message deletion
    await createAuditLog(
      'MESSAGE_DELETED',
      req.user.id,
      'CUSTOMER',
      { messageId, chatId },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Delete entire chat for everyone
router.delete('/:chatId', customerAuth, async (req, res) => {
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

    // Soft delete all messages in this chat
    await db.update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.chatId, chatId));

    // Create audit log
    await createAuditLog(
      'CHAT_DELETED',
      customer.id,
      'CUSTOMER',
      { chatId },
      req.ip,
      req.headers['user-agent']
    );

    // Notify both participants via Socket.io
    const io = getIo();
    if (io) {
      io.to(`chat_${chatId}`).emit('chat_deleted', { chatId });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Edit message
router.put('/:chatId/messages/:messageId', customerAuth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
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

    // Verify message belongs to this chat and user is the sender
    const message = await db.select().from(messages).where(
      and(
        eq(messages.id, messageId),
        eq(messages.chatId, chatId),
        eq(messages.senderId, customer.id)
      )
    ).limit(1);

    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Get encryption keys
    const senderKey = await getUserEncryptionKey(customer.id);
    const receiverId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    const receiverKey = await getUserEncryptionKey(receiverId);
    const sharedKey = deriveSharedKey(senderKey.privateKey, receiverKey.publicKey);

    // Encrypt new content
    const { encryptedContent, iv } = encryptMessage(content, sharedKey);

    // Update message
    await db.update(messages)
      .set({ 
        encryptedContent, 
        iv,
        edited: true,
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId));

    // Audit log for message edit
    await createAuditLog(
      'MESSAGE_EDITED',
      req.user.id,
      'CUSTOMER',
      { messageId, chatId },
      req.ip,
      req.get('user-agent')
    );

    res.json({ message: 'Message updated', decryptedContent: content });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Add reaction to a message
router.post('/:chatId/messages/:messageId/reactions', customerAuth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
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

    // Verify message belongs to this chat
    const message = await db.select().from(messages).where(
      and(
        eq(messages.id, messageId),
        eq(messages.chatId, chatId)
      )
    ).limit(1);

    if (message.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await db.select().from(messageReactions).where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.customerId, customer.id),
        eq(messageReactions.emoji, emoji)
      )
    ).limit(1);

    if (existingReaction.length > 0) {
      // Remove the reaction (toggle off)
      await db.delete(messageReactions).where(eq(messageReactions.id, existingReaction[0].id));
    } else {
      // Add the reaction
      await db.insert(messageReactions).values({
        messageId,
        customerId: customer.id,
        emoji
      });
    }

    // Get all reactions for this message
    const reactions = await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));

    // Emit reaction update via socket
    const io = getIo();
    const otherParticipantId = chat[0].participant1Id === customer.id ? chat[0].participant2Id : chat[0].participant1Id;
    const otherCustomer = await db.select().from(customers).where(eq(customers.id, otherParticipantId)).limit(1);
    if (otherCustomer.length > 0) {
      io.to(otherCustomer[0].userId).emit('message_reaction', {
        messageId,
        reactions
      });
    }

    res.json({ reactions });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Get reactions for a message
router.get('/:chatId/messages/:messageId/reactions', customerAuth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

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

    // Get all reactions for this message
    const reactions = await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));

    res.json({ reactions });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

module.exports = router;
