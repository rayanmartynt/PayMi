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
   * Format phone number to international format
   * @param {string} phone - Phone number in various formats
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with country code (assuming Sierra Leone +232)
    if (cleaned.startsWith('0')) {
      cleaned = '232' + cleaned.substring(1);
    }
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new SMSService();
