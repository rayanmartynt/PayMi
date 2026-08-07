const rabbitMQ = require('./rabbitmq');

class PaymentProcessor {
  async queuePayment(paymentData) {
    const message = {
      id: paymentData.id,
      merchantId: paymentData.merchantId,
      customerId: paymentData.customerId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      transactionReference: paymentData.transactionReference,
      timestamp: new Date().toISOString(),
    };

    const success = await rabbitMQ.publish('payments', 'process', message);
    if (!success) {
      console.error('Failed to queue payment for processing');
      return false;
    }

    console.log(`Payment ${paymentData.id} queued for processing`);
    return true;
  }

  async queueRefund(refundData) {
    const message = {
      id: refundData.id,
      transactionId: refundData.transactionId,
      amount: refundData.amount,
      reason: refundData.reason,
      timestamp: new Date().toISOString(),
    };

    const success = await rabbitMQ.publish('payments', 'refund', message);
    if (!success) {
      console.error('Failed to queue refund for processing');
      return false;
    }

    console.log(`Refund ${refundData.id} queued for processing`);
    return true;
  }

  async processPayment(message) {
    console.log('Processing payment:', message.id);
    
    try {
      // Simulate payment processing
      // In a real implementation, this would call the payment gateway APIs
      await this.simulatePaymentGatewayCall(message);
      
      console.log(`Payment ${message.id} processed successfully`);
      return { success: true, paymentId: message.id };
    } catch (error) {
      console.error(`Payment ${message.id} processing failed:`, error.message);
      return { success: false, paymentId: message.id, error: error.message };
    }
  }

  async processRefund(message) {
    console.log('Processing refund:', message.id);
    
    try {
      // Simulate refund processing
      await this.simulateRefundGatewayCall(message);
      
      console.log(`Refund ${message.id} processed successfully`);
      return { success: true, refundId: message.id };
    } catch (error) {
      console.error(`Refund ${message.id} processing failed:`, error.message);
      return { success: false, refundId: message.id, error: error.message };
    }
  }

  async simulatePaymentGatewayCall(paymentData) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (90% success rate)
    if (Math.random() > 0.1) {
      return { status: 'SUCCESSFUL' };
    }
    
    throw new Error('Payment gateway rejected the transaction');
  }

  async simulateRefundGatewayCall(refundData) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    return { status: 'SUCCESSFUL' };
  }

  startConsumers() {
    // Consume payment processing queue
    rabbitMQ.consume('payment_processing', async (message) => {
      if (message.routingKey === 'process' || !message.routingKey) {
        await this.processPayment(message);
      } else if (message.routingKey === 'refund') {
        await this.processRefund(message);
      }
    });
  }
}

module.exports = new PaymentProcessor();
