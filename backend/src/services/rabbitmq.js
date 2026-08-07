const amqp = require('amqplib');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queues = new Map();
    this.exchanges = new Map();
  }

  async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      console.log('RabbitMQ connected successfully');
      
      // Set up error handlers
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
      });
      
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });
      
      // Set up exchanges
      await this.setupExchanges();
      
      // Set up queues
      await this.setupQueues();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      return false;
    }
  }

  async setupExchanges() {
    const exchanges = [
      { name: 'payments', type: 'direct', options: { durable: true } },
      { name: 'notifications', type: 'topic', options: { durable: true } },
      { name: 'withdrawals', type: 'direct', options: { durable: true } },
      { name: 'kyc', type: 'direct', options: { durable: true } },
      { name: 'audit', type: 'fanout', options: { durable: true } },
    ];

    for (const exchange of exchanges) {
      try {
        await this.channel.assertExchange(exchange.name, exchange.type, exchange.options);
        this.exchanges.set(exchange.name, exchange);
        console.log(`Exchange '${exchange.name}' created`);
      } catch (error) {
        console.error(`Failed to create exchange '${exchange.name}':`, error.message);
      }
    }
  }

  async setupQueues() {
    const queues = [
      {
        name: 'payment_processing',
        options: { durable: true },
        bindings: [
          { exchange: 'payments', routingKey: 'process' },
          { exchange: 'payments', routingKey: 'refund' },
        ],
      },
      {
        name: 'email_notifications',
        options: { durable: true },
        bindings: [
          { exchange: 'notifications', routingKey: 'email.*' },
        ],
      },
      {
        name: 'push_notifications',
        options: { durable: true },
        bindings: [
          { exchange: 'notifications', routingKey: 'push.*' },
        ],
      },
      {
        name: 'withdrawal_processing',
        options: { durable: true },
        bindings: [
          { exchange: 'withdrawals', routingKey: 'process' },
        ],
      },
      {
        name: 'kyc_verification',
        options: { durable: true },
        bindings: [
          { exchange: 'kyc', routingKey: 'verify' },
        ],
      },
      {
        name: 'audit_logs',
        options: { durable: true },
        bindings: [
          { exchange: 'audit', routingKey: '' },
        ],
      },
    ];

    for (const queueConfig of queues) {
      try {
        await this.channel.assertQueue(queueConfig.name, queueConfig.options);
        
        for (const binding of queueConfig.bindings) {
          await this.channel.bindQueue(queueConfig.name, binding.exchange, binding.routingKey);
        }
        
        this.queues.set(queueConfig.name, queueConfig);
        console.log(`Queue '${queueConfig.name}' created and bound`);
      } catch (error) {
        console.error(`Failed to create queue '${queueConfig.name}':`, error.message);
      }
    }
  }

  async publish(exchange, routingKey, message, options = {}) {
    if (!this.channel) {
      console.error('RabbitMQ channel not available');
      return false;
    }

    try {
      const content = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options,
      };

      this.channel.publish(exchange, routingKey, content, defaultOptions);
      console.log(`Message published to exchange '${exchange}' with routing key '${routingKey}'`);
      return true;
    } catch (error) {
      console.error('Failed to publish message:', error.message);
      return false;
    }
  }

  async consume(queue, callback, options = {}) {
    if (!this.channel) {
      console.error('RabbitMQ channel not available');
      return false;
    }

    try {
      const defaultOptions = {
        noAck: false,
        ...options,
      };

      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content, msg);
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error.message);
            this.channel.nack(msg, false, true); // Requeue on error
          }
        }
      }, defaultOptions);

      console.log(`Started consuming from queue '${queue}'`);
      return true;
    } catch (error) {
      console.error(`Failed to consume from queue '${queue}':`, error.message);
      return false;
    }
  }

  async sendToQueue(queue, message, options = {}) {
    if (!this.channel) {
      console.error('RabbitMQ channel not available');
      return false;
    }

    try {
      const content = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        ...options,
      };

      this.channel.sendToQueue(queue, content, defaultOptions);
      console.log(`Message sent to queue '${queue}'`);
      return true;
    } catch (error) {
      console.error('Failed to send message to queue:', error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error.message);
    }
  }

  isConnected() {
    return this.connection !== null && this.channel !== null;
  }
}

// Export singleton instance
const rabbitMQService = new RabbitMQService();

module.exports = rabbitMQService;
