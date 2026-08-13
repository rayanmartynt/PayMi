const redis = require('redis');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 retries');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });
  }

  return redisClient;
}

async function connectRedis() {
  try {
    const client = getRedisClient();
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// User presence functions
async function setUserOnline(userId, socketId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return;
  
  await client.hSet(`user:${userId}`, 'online', 'true');
  await client.hSet(`user:${userId}`, 'socketId', socketId);
  await client.hSet(`user:${userId}`, 'lastSeen', Date.now());
  await client.expire(`user:${userId}`, 3600); // Expire after 1 hour
}

async function setUserOffline(userId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return;
  
  await client.hSet(`user:${userId}`, 'online', 'false');
  await client.hSet(`user:${userId}`, 'lastSeen', Date.now());
  await client.expire(`user:${userId}`, 3600);
}

async function getUserStatus(userId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return null;
  
  const data = await client.hGetAll(`user:${userId}`);
  if (Object.keys(data).length === 0) return null;
  
  return {
    online: data.online === 'true',
    socketId: data.socketId,
    lastSeen: parseInt(data.lastSeen)
  };
}

async function isUserOnline(userId) {
  const status = await getUserStatus(userId);
  return status ? status.online : false;
}

// Message status functions
async function setMessageDelivered(messageId, recipientId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return;
  
  await client.hSet(`message:${messageId}`, 'delivered', 'true');
  await client.hSet(`message:${messageId}`, 'deliveredAt', Date.now());
  await client.expire(`message:${messageId}`, 86400); // Expire after 24 hours
}

async function setMessageRead(messageId, recipientId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return;
  
  await client.hSet(`message:${messageId}`, 'read', 'true');
  await client.hSet(`message:${messageId}`, 'readAt', Date.now());
  await client.expire(`message:${messageId}`, 86400);
}

async function getMessageStatus(messageId) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return null;
  
  const data = await client.hGetAll(`message:${messageId}`);
  if (Object.keys(data).length === 0) return null;
  
  return {
    delivered: data.delivered === 'true',
    deliveredAt: data.deliveredAt ? parseInt(data.deliveredAt) : null,
    read: data.read === 'true',
    readAt: data.readAt ? parseInt(data.readAt) : null
  };
}

// Batch get multiple user statuses
async function getMultipleUserStatuses(userIds) {
  const client = getRedisClient();
  if (!client || !client.isOpen) return {};
  
  const statuses = {};
  for (const userId of userIds) {
    const status = await getUserStatus(userId);
    statuses[userId] = status;
  }
  return statuses;
}

module.exports = {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  setUserOnline,
  setUserOffline,
  getUserStatus,
  isUserOnline,
  setMessageDelivered,
  setMessageRead,
  getMessageStatus,
  getMultipleUserStatuses
};
