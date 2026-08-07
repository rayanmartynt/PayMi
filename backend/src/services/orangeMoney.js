const axios = require('axios');
const crypto = require('crypto');

class OrangeMoneyService {
  constructor() {
    this.apiKey = process.env.ORANGE_MONEY_API_KEY;
    this.secret = process.env.ORANGE_MONEY_SECRET;
    this.baseUrl = process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay';
    this.merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
  }

  /**
   * Initiate a payment with Orange Money
   * @param {string} phoneNumber - Customer phone number
   * @param {number} amount - Amount to charge
   * @param {string} currency - Currency code (default: XOF)
   * @param {string} reference - Transaction reference
   * @param {string} description - Payment description
   */
  async initiatePayment(phoneNumber, amount, currency = 'XOF', reference, description = '') {
    try {
      const timestamp = Date.now();
      const paymentData = {
        merchant_key: this.merchantKey,
        amount: amount.toString(),
        currency: currency,
        order_id: reference,
        description: description || 'Payment via Orange Money',
        return_url: `${process.env.FRONTEND_URL}/payment/return`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        notify_url: `${process.env.FRONTEND_URL}/api/webhooks/orange-money`,
        lang: 'en',
        phone_number: phoneNumber
      };

      // Generate signature
      const signature = this.generateSignature(paymentData, timestamp);
      paymentData.signature = signature;
      paymentData.timestamp = timestamp;

      const response = await axios.post(
        `${this.baseUrl}/payment/v1/webpayment`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.payment_token || reference,
        paymentToken: response.data.payment_token,
        paymentUrl: response.data.payment_url,
        status: 'PENDING',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      console.error('Orange Money payment error:', error.response?.data || error.message);
      throw new Error(`Orange Money payment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check the status of a transaction
   * @param {string} transactionId - Transaction ID to check
   */
  async checkStatus(transactionId) {
    try {
      const timestamp = Date.now();
      const signatureData = {
        merchant_key: this.merchantKey,
        order_id: transactionId,
        timestamp: timestamp
      };

      const signature = this.generateSignature(signatureData, timestamp);

      const response = await axios.get(
        `${this.baseUrl}/payment/v1/transaction/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'Content-Type': 'application/json'
          }
        }
      );

      const statusMap = {
        'INITIATED': 'PENDING',
        'PENDING': 'PENDING',
        'SUCCESSFUL': 'SUCCESSFUL',
        'FAILED': 'FAILED',
        'CANCELLED': 'FAILED',
        'EXPIRED': 'FAILED'
      };

      return {
        success: true,
        status: statusMap[response.data.status] || response.data.status,
        transactionId: response.data.order_id,
        amount: response.data.amount,
        currency: response.data.currency,
        paymentDate: response.data.payment_date
      };
    } catch (error) {
      console.error('Orange Money status check error:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate HMAC SHA256 signature for API requests
   */
  generateSignature(data, timestamp) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + `&timestamp=${timestamp}`;
    
    return crypto
      .createHmac('sha256', this.secret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Process webhook notification from Orange Money
   */
  async processWebhook(notificationData) {
    try {
      const { order_id, status, amount, currency, signature, timestamp } = notificationData;

      // Verify signature
      const expectedSignature = this.generateSignature({
        merchant_key: this.merchantKey,
        order_id,
        amount,
        currency,
        status
      }, timestamp);

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const statusMap = {
        'SUCCESS': 'SUCCESSFUL',
        'FAILED': 'FAILED',
        'CANCELLED': 'FAILED',
        'EXPIRED': 'FAILED'
      };

      return {
        success: true,
        transactionId: order_id,
        status: statusMap[status] || status,
        amount: parseFloat(amount),
        currency: currency
      };
    } catch (error) {
      console.error('Orange Money webhook processing error:', error.message);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Refund a transaction
   */
  async refund(transactionId, amount, reason = '') {
    try {
      const timestamp = Date.now();
      const refundData = {
        merchant_key: this.merchantKey,
        order_id: transactionId,
        amount: amount.toString(),
        reason: reason || 'Refund requested'
      };

      const signature = this.generateSignature(refundData, timestamp);
      refundData.signature = signature;
      refundData.timestamp = timestamp;

      const response = await axios.post(
        `${this.baseUrl}/payment/v1/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        transactionId: transactionId,
        status: 'REFUNDED',
        message: 'Refund processed successfully'
      };
    } catch (error) {
      console.error('Orange Money refund error:', error.response?.data || error.message);
      throw new Error(`Refund failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = OrangeMoneyService;
