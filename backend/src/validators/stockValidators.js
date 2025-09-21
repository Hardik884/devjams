const { query, param, body } = require('express-validator');

// Stock validation rules
const getTrendingValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const searchStocksValidation = [
  query('q').notEmpty().trim().isLength({ min: 1, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

const getTopPerformersValidation = [
  query('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['return', 'volume', 'marketCap']),
];

const getStockBySymbolValidation = [
  param('symbol').notEmpty().trim().isLength({ min: 1, max: 10 }).matches(/^[A-Z0-9.-]+$/i),
];

const getStockTechnicalsValidation = [
  param('symbol').notEmpty().trim().isLength({ min: 1, max: 10 }).matches(/^[A-Z0-9.-]+$/i),
  query('period').optional().isIn(['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y']),
  query('indicators').optional().custom((value) => {
    const validIndicators = ['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH'];
    const indicators = value.split(',');
    return indicators.every(indicator => validIndicators.includes(indicator.trim()));
  }).withMessage('Invalid technical indicators'),
];

const addToWatchlistValidation = [
  body('symbol').notEmpty().trim().isLength({ min: 1, max: 10 }).matches(/^[A-Z0-9.-]+$/i),
];

const getExchangesValidation = [
  query('country').optional().isLength({ min: 2, max: 3 }).matches(/^[A-Z]+$/i),
];

module.exports = {
  getTrendingValidation,
  searchStocksValidation,
  getTopPerformersValidation,
  getStockBySymbolValidation,
  getStockTechnicalsValidation,
  addToWatchlistValidation,
  getExchangesValidation,
};