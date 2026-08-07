const rabbitMQ = require('./rabbitmq');

class NotificationService {
  async queueEmailNotification(notificationData) {
    const message = {
      type: 'email',
      to: notificationData.to,
      subject: notificationData.subject,
      template: notificationData.template,
      data: notificationData.data,
      timestamp: new Date().toISOString(),
    };

    const routingKey = `email.${notificationData.type || 'general'}`;
    const success = await rabbitMQ.publish('notifications', routingKey, message);
    
    if (!success) {
      console.error('Failed to queue email notification');
      return false;
    }

    console.log(`Email notification queued for ${notificationData.to}`);
    return true;
  }

  async queuePushNotification(notificationData) {
    const message = {
      type: 'push',
      userId: notificationData.userId,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
      timestamp: new Date().toISOString(),
    };

    const routingKey = `push.${notificationData.type || 'general'}`;
    const success = await rabbitMQ.publish('notifications', routingKey, message);
    
    if (!success) {
      console.error('Failed to queue push notification');
      return false;
    }

    console.log(`Push notification queued for user ${notificationData.userId}`);
    return true;
  }

  async processEmailNotification(message) {
    console.log('Processing email notification:', message.to);
    
    try {
      // Simulate email sending
      await this.simulateEmailSend(message);
      
      console.log(`Email sent to ${message.to}`);
      return { success: true, to: message.to };
    } catch (error) {
      console.error(`Failed to send email to ${message.to}:`, error.message);
      return { success: false, to: message.to, error: error.message };
    }
  }

  async processPushNotification(message) {
    console.log('Processing push notification for user:', message.userId);
    
    try {
      // Simulate push notification sending
      await this.simulatePushSend(message);
      
      console.log(`Push notification sent to user ${message.userId}`);
      return { success: true, userId: message.userId };
    } catch (error) {
      console.error(`Failed to send push notification to user ${message.userId}:`, error.message);
      return { success: false, userId: message.userId, error: error.message };
    }
  }

  async simulateEmailSend(message) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate success
    return { status: 'sent' };
  }

  async simulatePushSend(message) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simulate success
    return { status: 'sent' };
  }

  startConsumers() {
    // Consume email notifications queue
    rabbitMQ.consume('email_notifications', async (message) => {
      await this.processEmailNotification(message);
    });

    // Consume push notifications queue
    rabbitMQ.consume('push_notifications', async (message) => {
      await this.processPushNotification(message);
    });
  }
}

module.exports = new NotificationService();
