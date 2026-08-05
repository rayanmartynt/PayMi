const axios = require('axios');
const crypto = require('crypto');

class PaymentGateway {
  constructor(type) {
    this.type = type;
    this.apiKey = process.env[`${type.toUpperCase()}_API_KEY`];
    this.secret = process.env[`${type.toUpperCase()}_SECRET`];
  }

  async initiatePayment(phoneNumber, amount, currency = 'SLE', reference) {
    try {
      // This is a placeholder implementation
      // You'll need to implement the actual API calls for each payment gateway
      const paymentData = {
        phoneNumber,
        amount,
        currency,
        reference,
        timestamp: Date.now()
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      paymentData.signature = signature;

      // Make API call to payment gateway
      // This is a mock implementation
      console.log(`Initiating ${this.type} payment:`, paymentData);
      
      return {
        success: true,
        transactionId: reference,
        status: 'PENDING',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      console.error(`${this.type} payment error:`, error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async checkStatus(transactionId) {
    try {
      // Placeholder for checking transaction status
      console.log(`Checking ${this.type} transaction status:`, transactionId);
      
      return {
        success: true,
        status: 'SUCCESSFUL',
        transactionId
      };
    } catch (error) {
      console.error(`${this.type} status check error:`, error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.secret)
      .update(signatureString)
      .digest('hex');
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
