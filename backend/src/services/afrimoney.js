const axios = require('axios');
const crypto = require('crypto');

class AfrimoneyService {
  constructor() {
    this.apiKey = process.env.AFRIMONEY_API_KEY;
    this.secret = process.env.AFRIMONEY_SECRET;
    this.baseUrl = process.env.AFRIMONEY_BASE_URL || 'https://api.afrimoney.com';
    this.merchantId = process.env.AFRIMONEY_MERCHANT_ID;
  }

  /**
   * Initiate a payment with Afrimoney
   * @param {string} phoneNumber - Customer phone number
   * @param {number} amount - Amount to charge
   * @param {string} currency - Currency code (default: SLL)
   * @param {string} reference - Transaction reference
   * @param {string} description - Payment description
   */
  async initiatePayment(phoneNumber, amount, currency = 'SLL', reference, description = '') {
    try {
      const timestamp = Date.now();
      const paymentData = {
        merchant_id: this.merchantId,
        phone_number: phoneNumber,
        amount: amount.toString(),
        currency: currency,
        transaction_id: reference,
        description: description || 'Payment via Afrimoney',
        callback_url: `${process.env.FRONTEND_URL}/api/webhooks/afrimoney`,
        timestamp: timestamp
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      paymentData.signature = signature;

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/initiate`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.transaction_id || reference,
        paymentToken: response.data.payment_token,
        paymentUrl: response.data.payment_url,
        status: 'PENDING',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      console.error('Afrimoney payment error:', error.response?.data || error.message);
      throw new Error(`Afrimoney payment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check the status of a transaction
   * @param {string} transactionId - Transaction ID to check
   */
  async checkStatus(transactionId) {
    try {
      const timestamp = Date.now();
      const statusData = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        timestamp: timestamp
      };

      const signature = this.generateSignature(statusData);

      const response = await axios.get(
        `${this.baseUrl}/v1/payments/status/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'X-API-Key': this.apiKey
          }
        }
      );

      const statusMap = {
        'INITIATED': 'PENDING',
        'PENDING': 'PENDING',
        'PROCESSING': 'PENDING',
        'SUCCESS': 'SUCCESSFUL',
        'COMPLETED': 'SUCCESSFUL',
        'FAILED': 'FAILED',
        'CANCELLED': 'FAILED',
        'EXPIRED': 'FAILED',
        'REJECTED': 'FAILED'
      };

      return {
        success: true,
        status: statusMap[response.data.status] || response.data.status,
        transactionId: response.data.transaction_id,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        paymentDate: response.data.completed_at || response.data.created_at
      };
    } catch (error) {
      console.error('Afrimoney status check error:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate HMAC SHA256 signature for API requests
   */
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

  /**
   * Process webhook notification from Afrimoney
   */
  async processWebhook(notificationData) {
    try {
      const { transaction_id, status, amount, currency, signature, timestamp } = notificationData;

      // Verify signature
      const expectedSignature = this.generateSignature({
        merchant_id: this.merchantId,
        transaction_id,
        amount,
        currency,
        status,
        timestamp
      });

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const statusMap = {
        'SUCCESS': 'SUCCESSFUL',
        'COMPLETED': 'SUCCESSFUL',
        'FAILED': 'FAILED',
        'CANCELLED': 'FAILED',
        'EXPIRED': 'FAILED',
        'REJECTED': 'FAILED'
      };

      return {
        success: true,
        transactionId: transaction_id,
        status: statusMap[status] || status,
        amount: parseFloat(amount),
        currency: currency
      };
    } catch (error) {
      console.error('Afrimoney webhook processing error:', error.message);
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
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount: amount.toString(),
        reason: reason || 'Refund requested',
        timestamp: timestamp
      };

      const signature = this.generateSignature(refundData);
      refundData.signature = signature;

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
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
      console.error('Afrimoney refund error:', error.response?.data || error.message);
      throw new Error(`Refund failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate phone number format for Afrimoney
   */
  validatePhoneNumber(phoneNumber) {
    // Afrimoney typically uses Sierra Leone format: +232 XX XXX XXX
    const phoneRegex = /^\+232[0-9]{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to Afrimoney format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or parentheses
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add +232 prefix if not present
    if (!cleaned.startsWith('+232')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+232' + cleaned.substring(1);
      } else if (cleaned.startsWith('232')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+232' + cleaned;
      }
    }
    
    return cleaned;
  }
}

module.exports = AfrimoneyService;
