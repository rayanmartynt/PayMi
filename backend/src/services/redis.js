const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const url = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return retries * 100;
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('Redis connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      return false;
    }
  }

  async set(key, value, options = {}) {
    if (!this.isConnected) {
      console.warn('Redis not connected - cache set skipped');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      
      if (options.expiry) {
        await this.client.setEx(key, options.expiry, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error.message);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delete pattern error:', error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error.message);
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error.message);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error.message);
      return -1;
    }
  }

  async flushDb() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('Redis database flushed');
      return true;
    } catch (error) {
      console.error('Redis flush error:', error.message);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }

  // Cache helpers for common use cases
  async cacheUser(userId, userData, expiry = 3600) {
    const key = `user:${userId}`;
    return await this.set(key, userData, { expiry });
  }

  async getCachedUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUser(userId) {
    const key = `user:${userId}`;
    return await this.del(key);
  }

  async cacheMerchant(merchantId, merchantData, expiry = 3600) {
    const key = `merchant:${merchantId}`;
    return await this.set(key, merchantData, { expiry });
  }

  async getCachedMerchant(merchantId) {
    const key = `merchant:${merchantId}`;
    return await this.get(key);
  }

  async invalidateMerchant(merchantId) {
    const key = `merchant:${merchantId}`;
    return await this.del(key);
  }

  async cacheTransaction(transactionId, transactionData, expiry = 1800) {
    const key = `transaction:${transactionId}`;
    return await this.set(key, transactionData, { expiry });
  }

  async getCachedTransaction(transactionId) {
    const key = `transaction:${transactionId}`;
    return await this.get(key);
  }

  async invalidateTransaction(transactionId) {
    const key = `transaction:${transactionId}`;
    return await this.del(key);
  }

  async cacheRateLimit(identifier, count, windowMs) {
    const key = `ratelimit:${identifier}`;
    const expiry = Math.ceil(windowMs / 1000);
    return await this.set(key, count, { expiry });
  }

  async getCachedRateLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    return await this.get(key);
  }

  async invalidateRateLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    return await this.del(key);
  }
}

// Export singleton instance
const redisService = new RedisService();

module.exports = redisService;
