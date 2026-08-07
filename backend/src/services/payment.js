const OrangeMoneyService = require('./orangeMoney');
const AfrimoneyService = require('./afrimoney');
const QMoneyService = require('./qmoney');

class PaymentGateway {
  constructor(type) {
    this.type = type.toLowerCase();
    
    switch (this.type) {
      case 'orange':
        this.service = new OrangeMoneyService();
        break;
      case 'afrimoney':
        this.service = new AfrimoneyService();
        break;
      case 'qmoney':
        this.service = new QMoneyService();
        break;
      default:
        throw new Error(`Unsupported payment gateway: ${type}`);
    }
  }

  async initiatePayment(phoneNumber, amount, currency = 'SLE', reference, description = '') {
    try {
      // Format phone number based on gateway
      let formattedPhone = phoneNumber;
      if (this.service.formatPhoneNumber) {
        formattedPhone = this.service.formatPhoneNumber(phoneNumber);
      }

      // Validate phone number if gateway supports it
      if (this.service.validatePhoneNumber && !this.service.validatePhoneNumber(formattedPhone)) {
        throw new Error(`Invalid phone number format for ${this.type}`);
      }

      const result = await this.service.initiatePayment(
        formattedPhone,
        amount,
        currency,
        reference,
        description
      );

      return {
        success: true,
        transactionId: result.transactionId,
        paymentToken: result.paymentToken,
        paymentUrl: result.paymentUrl,
        status: result.status,
        message: result.message
      };
    } catch (error) {
      console.error(`${this.type} payment error:`, error.message);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async checkStatus(transactionId) {
    try {
      const result = await this.service.checkStatus(transactionId);

      return {
        success: true,
        status: result.status,
        transactionId: result.transactionId,
        amount: result.amount,
        currency: result.currency,
        paymentDate: result.paymentDate
      };
    } catch (error) {
      console.error(`${this.type} status check error:`, error.message);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  async processWebhook(notificationData) {
    try {
      if (!this.service.processWebhook) {
        throw new Error(`Webhook processing not supported for ${this.type}`);
      }

      const result = await this.service.processWebhook(notificationData);

      return {
        success: true,
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount,
        currency: result.currency
      };
    } catch (error) {
      console.error(`${this.type} webhook processing error:`, error.message);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  async refund(transactionId, amount, reason = '') {
    try {
      if (!this.service.refund) {
        throw new Error(`Refund not supported for ${this.type}`);
      }

      const result = await this.service.refund(transactionId, amount, reason);

      return {
        success: true,
        refundId: result.refundId,
        transactionId: result.transactionId,
        status: result.status,
        message: result.message
      };
    } catch (error) {
      console.error(`${this.type} refund error:`, error.message);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

class StripePayment {
  constructor() {
    this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      };
    } catch (error) {
      console.error('Stripe confirmation error:', error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }
}

module.exports = {
  PaymentGateway,
  StripePayment
};
