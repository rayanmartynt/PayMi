const express = require('express');
const router = express.Router();
const currencyService = require('../services/currency');

/**
 * Get all supported currencies
 * GET /api/currency/supported
 */
router.get('/supported', (req, res) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    const currencyInfo = currencies.map(code => ({
      ...currencyService.getCurrencyInfo(code),
      exchangeRate: currencyService.getExchangeRate('SLE', code)
    }));

    res.json({ currencies: currencyInfo });
  } catch (error) {
    console.error('Get supported currencies error:', error);
    res.status(500).json({ error: 'Failed to get supported currencies' });
  }
});

/**
 * Convert amount between currencies
 * GET /api/currency/convert
 */
router.get('/convert', (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to parameters are required' });
    }

    const convertedAmount = currencyService.convert(parseFloat(amount), from.toUpperCase(), to.toUpperCase());
    const exchangeRate = currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

    res.json({
      originalAmount: parseFloat(amount),
      originalCurrency: from.toUpperCase(),
      convertedAmount,
      targetCurrency: to.toUpperCase(),
      exchangeRate,
      formatted: currencyService.format(convertedAmount, to.toUpperCase())
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert currency' });
  }
});

/**
 * Get exchange rate between two currencies
 * GET /api/currency/rate
 */
router.get('/rate', (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'From and to parameters are required' });
    }

    const rate = currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    res.status(500).json({ error: error.message || 'Failed to get exchange rate' });
  }
});

/**
 * Get currency information
 * GET /api/currency/info/:code
 */
router.get('/info/:code', (req, res) => {
  try {
    const info = currencyService.getCurrencyInfo(req.params.code.toUpperCase());

    if (!info) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    res.json({ currency: info });
  } catch (error) {
    console.error('Get currency info error:', error);
    res.status(500).json({ error: 'Failed to get currency info' });
  }
});

module.exports = router;
