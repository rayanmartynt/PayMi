/**
 * AI-powered chatbot service for customer support
 * Simple rule-based chatbot for PayMi customer support
 */

class ChatbotService {
  constructor() {
    this.intents = this.initializeIntents();
  }

  initializeIntents() {
    return {
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        responses: [
          'Hello! Welcome to PayMi customer support. How can I help you today?',
          'Hi there! I\'m here to assist you with any questions about PayMi.',
          'Hello! How can I assist you with your PayMi account today?'
        ]
      },
      payment_help: {
        keywords: ['payment', 'pay', 'send money', 'transfer', 'how to pay'],
        responses: [
          'To make a payment, go to your dashboard and click on "Send Payment". You can pay using Orange Money, Afrimoney, or QMoney.',
          'You can send payments by selecting the recipient, entering the amount, and choosing your payment method. We support Orange Money, Afrimoney, and QMoney.',
          'For payments, navigate to the Payments section, enter the recipient\'s phone number or select from your contacts, and follow the prompts.'
        ]
      },
      balance: {
        keywords: ['balance', 'how much', 'money', 'account balance', 'check balance'],
        responses: [
          'You can check your balance by logging into your account and viewing your dashboard. Your current balance is displayed at the top.',
          'Your account balance is available on your dashboard. It updates in real-time after each transaction.',
          'To check your balance, go to your account overview. You\'ll see your available balance and recent transactions.'
        ]
      },
      transaction_history: {
        keywords: ['history', 'transactions', 'past payments', 'previous', 'records'],
        responses: [
          'You can view your transaction history in the Transactions section of your dashboard. It shows all your past payments and receipts.',
          'Your transaction history is available under the "Transactions" tab. You can filter by date, amount, or payment method.',
          'To see your past transactions, click on "Transactions" in your account menu. You can also download statements from there.'
        ]
      },
      fees: {
        keywords: ['fee', 'charge', 'cost', 'price', 'how much does it cost'],
        responses: [
          'PayMi charges a small fee of 1.5% for transactions. Instant settlements have an additional 2% fee.',
          'Our standard transaction fee is 1.5%. Some services like instant settlement have additional fees.',
          'Transaction fees are 1.5% of the payment amount. You can see the exact fee before confirming any payment.'
        ]
      },
      security: {
        keywords: ['security', 'safe', 'secure', 'protect', '2fa', 'two factor'],
        responses: [
          'PayMi uses bank-level encryption to protect your transactions. We also offer 2FA (two-factor authentication) for added security.',
          'Your security is our priority. We use encryption, fraud detection, and offer 2FA to keep your account safe.',
          'You can enable 2FA in your account settings for additional security. We also monitor all transactions for suspicious activity.'
        ]
      },
      support: {
        keywords: ['help', 'support', 'contact', 'problem', 'issue'],
        responses: [
          'For additional help, you can contact our support team at support@paymi.sl or call us at +232 XX XXX XXX.',
          'If you need further assistance, please reach out to our customer support team via email or phone.',
          'Our support team is available 24/7. You can contact us through the Help section or directly at support@paymi.sl'
        ]
      },
      refund: {
        keywords: ['refund', 'return', 'money back', 'dispute'],
        responses: [
          'If you need a refund, please contact the merchant first. If they don\'t respond, you can file a dispute in your account.',
          'Refunds are processed by the merchant. If you have issues with a refund, you can open a dispute in the Disputes section.',
          'To request a refund, contact the merchant directly. For disputes, use the Dispute feature in your account.'
        ]
      },
      kyc: {
        keywords: ['kyc', 'verification', 'verify', 'identity', 'document'],
        responses: [
          'KYC (Know Your Customer) verification is required for certain transactions. You can upload your documents in the KYC section.',
          'To verify your account, go to Settings > KYC and upload a valid ID and proof of address.',
          'KYC verification helps protect your account. Upload your ID and address proof in the KYC section to get verified.'
        ]
      },
      default: {
        keywords: [],
        responses: [
          'I\'m not sure I understand. Could you please rephrase your question?',
          'I can help with questions about payments, balances, transactions, fees, and security. What would you like to know?',
          'Let me connect you with a human agent who can better assist you with this query.'
        ]
      }
    };
  }

  /**
   * Get chatbot response for user message
   */
  getResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, data] of Object.entries(this.intents)) {
      if (intent === 'default') continue;
      
      for (const keyword of data.keywords) {
        if (lowerMessage.includes(keyword)) {
          const responses = data.responses;
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }

    // Default response
    const defaultResponses = this.intents.default.responses;
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  /**
   * Get chat suggestions
   */
  getSuggestions() {
    return [
      'How do I make a payment?',
      'Check my balance',
      'View transaction history',
      'What are the fees?',
      'How secure is PayMi?',
      'Contact support'
    ];
  }
}

module.exports = new ChatbotService();
