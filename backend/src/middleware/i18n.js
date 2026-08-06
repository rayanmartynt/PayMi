const i18nService = require('../services/i18n');

/**
 * i18n middleware to detect language and add to request
 */
const i18nMiddleware = (req, res, next) => {
  // Get language from header, query param, or default to English
  const language = req.headers['accept-language'] || req.query.lang || 'en';
  
  // Validate language
  const supportedLang = i18nService.isLanguageSupported(language) ? language : 'en';
  
  req.language = supportedLang;
  req.i18n = (key) => i18nService.translate(key, supportedLang);
  
  next();
};

/**
 * Helper to send translated response
 */
const sendTranslatedResponse = (res, key, data = {}, statusCode = 200) => {
  const language = res.req?.language || 'en';
  const message = i18nService.translate(key, language);
  
  res.status(statusCode).json({
    message,
    language,
    ...data
  });
};

module.exports = {
  i18nMiddleware,
  sendTranslatedResponse
};
