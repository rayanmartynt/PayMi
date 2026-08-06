/**
 * Currency service for multi-currency support
 */

// Exchange rates (in production, fetch from external API)
const exchangeRates = {
  SLE: 1, // Sierra Leone Leone (base currency)
  USD: 0.000048, // 1 SLE = 0.000048 USD
  EUR: 0.000044, // 1 SLE = 0.000044 EUR
  GBP: 0.000038, // 1 SLE = 0.000038 GBP
  NGN: 0.055, // 1 SLE = 0.055 NGN
  GHS: 0.00032 // 1 SLE = 0.00032 GHS
};

// Supported currencies
const supportedCurrencies = Object.keys(exchangeRates);

class CurrencyService {
  /**
   * Convert amount from one currency to another
   */
  convert(amount, fromCurrency, toCurrency) {
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error('Unsupported currency');
    }

    // Convert to base currency (SLE) first, then to target currency
    const amountInSLE = amount / fromRate;
    const convertedAmount = amountInSLE * toRate;

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(fromCurrency, toCurrency) {
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error('Unsupported currency');
    }

    return toRate / fromRate;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return supportedCurrencies;
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency) {
    return supportedCurrencies.includes(currency);
  }

  /**
   * Format amount with currency symbol
   */
  format(amount, currency) {
    const symbols = {
      SLE: 'Le',
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      GHS: '₵'
    };

    const symbol = symbols[currency] || currency;
    return `${symbol} ${amount.toFixed(2)}`;
  }

  /**
   * Get currency info
   */
  getCurrencyInfo(currency) {
    const info = {
      SLE: { name: 'Sierra Leone Leone', symbol: 'Le', code: 'SLE' },
      USD: { name: 'US Dollar', symbol: '$', code: 'USD' },
      EUR: { name: 'Euro', symbol: '€', code: 'EUR' },
      GBP: { name: 'British Pound', symbol: '£', code: 'GBP' },
      NGN: { name: 'Nigerian Naira', symbol: '₦', code: 'NGN' },
      GHS: { name: 'Ghanaian Cedi', symbol: '₵', code: 'GHS' }
    };

    return info[currency];
  }
}

module.exports = new CurrencyService();
