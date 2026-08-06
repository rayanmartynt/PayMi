/**
 * Internationalization (i18n) service for multi-language support
 */

const translations = {
  en: {
    // Auth
    login_success: 'Login successful',
    login_failed: 'Login failed',
    invalid_credentials: 'Invalid credentials',
    two_factor_required: 'Two-factor authentication required',
    two_factor_enabled: '2FA enabled successfully',
    two_factor_disabled: '2FA disabled successfully',
    
    // Payments
    payment_successful: 'Payment successful',
    payment_failed: 'Payment failed',
    payment_pending: 'Payment pending',
    payment_refunded: 'Payment refunded',
    
    // Transactions
    transaction_created: 'Transaction created',
    transaction_not_found: 'Transaction not found',
    
    // Invoices
    invoice_created: 'Invoice created successfully',
    invoice_sent: 'Invoice sent successfully',
    invoice_paid: 'Invoice marked as paid',
    invoice_cancelled: 'Invoice cancelled successfully',
    
    // Subscriptions
    subscription_created: 'Subscription created successfully',
    subscription_paused: 'Subscription paused successfully',
    subscription_resumed: 'Subscription resumed successfully',
    subscription_cancelled: 'Subscription cancelled successfully',
    
    // Escrow
    escrow_created: 'Escrow created successfully',
    escrow_funded: 'Escrow funded successfully',
    escrow_released: 'Escrow released successfully',
    escrow_refunded: 'Escrow refunded successfully',
    
    // QR Codes
    qr_code_generated: 'QR code generated successfully',
    qr_code_scanned: 'QR code scanned successfully',
    
    // Settlements
    settlement_requested: 'Settlement requested',
    instant_settlement_requested: 'Instant settlement requested',
    
    // General
    success: 'Success',
    error: 'Error',
    not_found: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    server_error: 'Internal server error',
    validation_error: 'Validation error',
    
    // Common
    required_field: 'This field is required',
    invalid_email: 'Invalid email address',
    invalid_phone: 'Invalid phone number',
    password_too_short: 'Password must be at least 8 characters',
    passwords_do_not_match: 'Passwords do not match'
  },
  kr: {
    // Auth
    login_success: 'Login bin don',
    login_failed: 'Login fail',
    invalid_credentials: 'Wetin yu put no correct',
    two_factor_required: 'Yu need tu facto authentication',
    two_factor_enabled: '2FA don on',
    two_factor_disabled: '2FA don off',
    
    // Payments
    payment_successful: 'Payment don go',
    payment_failed: 'Payment no go',
    payment_pending: 'Payment dey wait',
    payment_refunded: 'Money don return',
    
    // Transactions
    transaction_created: 'Transaction don create',
    transaction_not_found: 'We no see transaction',
    
    // Invoices
    invoice_created: 'Invoice don create',
    invoice_sent: 'Invoice don send',
    invoice_paid: 'Invoice don pay',
    invoice_cancelled: 'Invoice don cancel',
    
    // Subscriptions
    subscription_created: 'Subscription don create',
    subscription_paused: 'Subscription don pause',
    subscription_resumed: 'Subscription don continue',
    subscription_cancelled: 'Subscription don cancel',
    
    // Escrow
    escrow_created: 'Escrow don create',
    escrow_funded: 'Escrow don put money inside',
    escrow_released: 'Escrow don release',
    escrow_refunded: 'Escrow money don return',
    
    // QR Codes
    qr_code_generated: 'QR code don generate',
    qr_code_scanned: 'QR code don scan',
    
    // Settlements
    settlement_requested: 'Settlement don request',
    instant_settlement_requested: 'Instant settlement don request',
    
    // General
    success: 'E good',
    error: 'Problem dey',
    not_found: 'We no see am',
    unauthorized: 'Yu no get permission',
    forbidden: 'Yu no fo do dis',
    server_error: 'Server get problem',
    validation_error: 'Wetin yu put no correct',
    
    // Common
    required_field: 'Yu fo fill dis place',
    invalid_email: 'Email no correct',
    invalid_phone: 'Phone number no correct',
    password_too_short: 'Password fo pass 8 letters',
    passwords_do_not_match: 'Password no match'
  }
};

class I18nService {
  /**
   * Get translation for a key
   */
  translate(key, language = 'en') {
    const lang = translations[language] || translations['en'];
    return lang[key] || translations['en'][key] || key;
  }

  /**
   * Get all translations for a language
   */
  getTranslations(language = 'en') {
    return translations[language] || translations['en'];
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(translations);
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language) {
    return translations.hasOwnProperty(language);
  }
}

module.exports = new I18nService();
