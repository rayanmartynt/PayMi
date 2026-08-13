const Zavudev = require('@zavudev/sdk');

class SMSService {
  constructor() {
    this.apiKey = process.env.ZAVU_API_KEY;
    this.senderId = process.env.ZAVU_SENDER_ID || 'PayMi';
    this.zavu = new Zavudev({ apiKey: this.apiKey });
  }

  /**
   * Send SMS verification code
   * @param {string} phoneNumber - Phone number in international format (e.g., +2341234567890)
   * @param {string} code - Verification code to send
   * @returns {Promise<boolean>}
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      // Always log verification code for development
      console.log(`[SMS] Verification code for ${phoneNumber}: ${code}`);
      
      // In sandbox mode, log instead of sending actual SMS
      if (process.env.SANDBOX_MODE === 'true') {
        console.log(`[SMS Sandbox] Verification code for ${phoneNumber}: ${code}`);
        return true;
      }

      const { message } = await this.zavu.messages.send({
        to: phoneNumber,
        channel: 'sms_oneway',
        text: `Your PayMi verification code is: ${code}. Valid for 10 minutes.`
      }, {
        headers: { "Zavu-Sender": this.senderId },
      });

      console.log("Sent:", message.id);
      return message !== null;
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      // In development, log the code even if SMS fails
      console.log(`[SMS Fallback] Verification code for ${phoneNumber}: ${code}`);
      return false;
    }
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid
   */
  isValidPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    // Valid formats:
    // - 9 digits (local without leading 0)
    // - 10 digits starting with 0 (local with leading 0)
    // - 11 digits starting with 232 (with country code)
    // - 12 digits starting with +232 (with country code and +)
    
    if (cleaned.length === 9) {
      return true; // Local format without leading 0
    }
    
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return true; // Local format with leading 0
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('232')) {
      return true; // With country code
    }
    
    if (phone.startsWith('+232') && cleaned.length === 11) {
      return true; // With country code and +
    }
    
    return false;
  }

  /**
   * Format phone number to international format
   * @param {string} phone - Phone number in various formats
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different input formats
    // If already has country code (232 for Sierra Leone), ensure it's properly formatted
    if (cleaned.startsWith('232') && cleaned.length === 11) {
      // Already has country code, just add +
      return '+' + cleaned;
    }
    
    // If starts with 0 and is 10 digits (local format), add country code
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '232' + cleaned.substring(1);
      return '+' + cleaned;
    }
    
    // If it's 9 digits without leading 0, add country code
    if (cleaned.length === 9) {
      cleaned = '232' + cleaned;
      return '+' + cleaned;
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add + to whatever we have
    return '+' + cleaned;
  }
}

module.exports = new SMSService();
