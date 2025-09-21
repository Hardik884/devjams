const express = require('express');
const { validationResult } = require('express-validator');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getTrendingStocks,
  searchStocks,
  getTopPerformers,
  getStockBySymbol,
  getStockTechnicals,
  getWatchlist,
  addToWatchlist,
  getExchanges,
} = require('../controllers/stockController');
const {
  getTrendingValidation,
  searchStocksValidation,
  getTopPerformersValidation,
  getStockBySymbolValidation,
  getStockTechnicalsValidation,
  addToWatchlistValidation,
  getExchangesValidation,
} = require('../validators/stockValidators');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           example: AAPL
 *         name:
 *           type: string
 *           example: Apple Inc.
 *         exchange:
 *           type: string
 *           example: NASDAQ
 *         country:
 *           type: string
 *           example: US
 *         price:
 *           type: object
 *           properties:
 *             current:
 *               type: number
 *               example: 150.25
 *             previousClose:
 *               type: number
 *               example: 149.80
 *         marketCap:
 *           type: number
 *           example: 2500000000000
 *         fundamentals:
 *           type: object
 *           properties:
 *             peRatio:
 *               type: number
 *               example: 28.5
 *             priceToBookRatio:
 *               type: number
 *               example: 8.2
 *         returns:
 *           type: object
 *           properties:
 *             oneDay:
 *               type: number
 *               example: 2.1
 *             oneYear:
 *               type: number
 *               example: 15.7
 */

/**
 * @swagger
 * /api/stocks/trending:
 *   get:
 *     summary: Get trending stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of trending stocks to return
 *     responses:
 *       200:
 *         description: List of trending stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stock'
 */
router.get('/trending', getTrendingValidation, handleValidationErrors, getTrendingStocks);

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: Search stocks by symbol or name
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (symbol or company name)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchStocksValidation, handleValidationErrors, searchStocks);

/**
 * @swagger
 * /api/stocks/top-performers:
 *   get:
 *     summary: Get top performing stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1D, 1W, 1M, 3M, 6M, 1Y]
 *           default: 1D
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [return, volume, marketCap]
 *           default: return
 *     responses:
 *       200:
 *         description: Top performing stocks
 */
router.get('/top-performers', getTopPerformersValidation, handleValidationErrors, getTopPerformers);

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   get:
 *     summary: Get stock details by symbol
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *     responses:
 *       200:
 *         description: Stock details
 *       404:
 *         description: Stock not found
 */
router.get('/:symbol', getStockBySymbolValidation, handleValidationErrors, getStockBySymbol);

/**
 * @swagger
 * /api/stocks/{symbol}/technicals:
 *   get:
 *     summary: Get technical analysis for a stock
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1D, 5D, 1M, 3M, 6M, 1Y, 2Y, 5Y]
 *           default: 1D
 *       - in: query
 *         name: indicators
 *         schema:
 *           type: string
 *           default: RSI,MACD,SMA
 *         description: Comma-separated list of technical indicators
 *     responses:
 *       200:
 *         description: Technical analysis data
 *       404:
 *         description: Stock not found
 */
router.get('/:symbol/technicals', getStockTechnicalsValidation, handleValidationErrors, getStockTechnicals);

/**
 * @swagger
 * /api/stocks/watchlist:
 *   get:
 *     summary: Get user's watchlist
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's watchlist
 */
router.get('/watchlist', protect, getWatchlist);

/**
 * @swagger
 * /api/stocks/watchlist:
 *   post:
 *     summary: Add stock to watchlist
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: AAPL
 *     responses:
 *       200:
 *         description: Stock added to watchlist
 *       400:
 *         description: Stock already in watchlist or invalid symbol
 *       404:
 *         description: Stock not found
 */
router.post('/watchlist', protect, addToWatchlistValidation, handleValidationErrors, addToWatchlist);

/**
 * @swagger
 * /api/stocks/exchanges:
 *   get:
 *     summary: Get available exchanges
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code (e.g., US, IN)
 *     responses:
 *       200:
 *         description: List of available exchanges
 */
router.get('/exchanges', getExchangesValidation, handleValidationErrors, getExchanges);

module.exports = router;