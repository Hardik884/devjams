const express = require('express');
const { param, query, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const stockDataService = require('../services/stockDataService');
const logger = require('../utils/logger');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

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
router.get('/trending', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const limit = req.query.limit || 50;

    // Try to get from database first
    let trendingStocks = await Stock.getTrendingStocks(limit);

    // If database is empty or data is stale, fetch from external API
    if (trendingStocks.length === 0 || 
        (trendingStocks[0] && new Date() - trendingStocks[0].lastUpdated > 15 * 60 * 1000)) {
      
      logger.info('Fetching fresh trending stocks data from external API');
      
      try {
        const freshData = await stockDataService.fetchTrendingStocks();
        
        // Update database with fresh data
        for (const stockData of freshData) {
          await Stock.findOneAndUpdate(
            { symbol: stockData.symbol },
            { 
              ...stockData,
              isActive: true,
              lastUpdated: new Date(),
            },
            { upsert: true, new: true }
          );
        }

        trendingStocks = await Stock.getTrendingStocks(limit);
      } catch (apiError) {
        logger.error('Error fetching trending stocks from API:', apiError.message);
        // If API fails, return whatever we have in database
        if (trendingStocks.length === 0) {
          return res.status(503).json({
            success: false,
            error: 'Unable to fetch trending stocks data',
          });
        }
      }
    }

    res.json({
      success: true,
      count: trendingStocks.length,
      data: trendingStocks,
      lastUpdated: trendingStocks[0]?.lastUpdated,
    });
  } catch (error) {
    next(error);
  }
});

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
router.get('/search', [
  query('q').notEmpty().trim().isLength({ min: 1, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { q, limit = 20 } = req.query;

    const results = await Stock.searchStocks(q, limit);

    res.json({
      success: true,
      count: results.length,
      data: results,
      query: q,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stocks/top-performers:
 *   get:
 *     summary: Get top performing stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [oneDay, oneWeek, oneMonth, threeMonths, sixMonths, oneYear]
 *           default: oneDay
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Top performing stocks
 */
router.get('/top-performers', [
  query('timeframe').optional().isIn(['oneDay', 'oneWeek', 'oneMonth', 'threeMonths', 'sixMonths', 'oneYear']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { timeframe = 'oneDay', limit = 20 } = req.query;

    const topPerformers = await Stock.getTopPerformers(timeframe, limit);

    res.json({
      success: true,
      count: topPerformers.length,
      data: topPerformers,
      timeframe,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   get:
 *     summary: Get detailed stock information
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, GOOGL)
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh from external API
 *     responses:
 *       200:
 *         description: Detailed stock information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Stock'
 *       404:
 *         description: Stock not found
 */
router.get('/:symbol', [
  param('symbol').isAlpha().isLength({ min: 1, max: 10 }).toUpperCase(),
  query('refresh').optional().isBoolean().toBoolean(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { symbol } = req.params;
    const { refresh = false } = req.query;

    let stock = await Stock.findOne({ symbol, isActive: true });

    // Check if we need to fetch fresh data
    const shouldRefresh = refresh || 
      !stock || 
      (new Date() - stock.lastUpdated > 5 * 60 * 1000); // 5 minutes

    if (shouldRefresh) {
      logger.info(`Fetching fresh data for ${symbol}`);
      
      try {
        const stockData = await stockDataService.getCompleteStockData(symbol);
        
        stock = await Stock.findOneAndUpdate(
          { symbol },
          { 
            ...stockData,
            isActive: true,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true }
        );

        // Calculate trending score
        stock.calculateTrendingScore();
        await stock.save();

      } catch (apiError) {
        logger.error(`Error fetching stock data for ${symbol}:`, apiError.message);
        
        if (!stock) {
          return res.status(404).json({
            success: false,
            error: `Stock ${symbol} not found`,
          });
        }
        // If API fails but we have cached data, use it
      }
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: `Stock ${symbol} not found`,
      });
    }

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stocks/{symbol}/technicals:
 *   get:
 *     summary: Get technical indicators for a stock
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technical indicators
 */
router.get('/:symbol/technicals', [
  param('symbol').isAlpha().isLength({ min: 1, max: 10 }).toUpperCase(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { symbol } = req.params;

    const stock = await Stock.findOne({ symbol, isActive: true });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: `Stock ${symbol} not found`,
      });
    }

    res.json({
      success: true,
      data: {
        symbol: stock.symbol,
        technicalIndicators: stock.technicalIndicators,
        lastUpdated: stock.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
});

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
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: AAPL
 */
router.use('/watchlist', protect); // Protect watchlist routes

router.get('/watchlist', async (req, res, next) => {
  try {
    // This would typically be stored in a separate Watchlist model
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Watchlist functionality coming soon',
      data: [],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/watchlist', async (req, res, next) => {
  try {
    // Placeholder for adding to watchlist
    res.json({
      success: true,
      message: 'Watchlist functionality coming soon',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stocks/exchanges:
 *   get:
 *     summary: Get stocks by exchange
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: exchange
 *         required: true
 *         schema:
 *           type: string
 *           example: NASDAQ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Stocks from the specified exchange
 */
router.get('/exchanges', [
  query('exchange').notEmpty().trim().isLength({ min: 1, max: 20 }),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { exchange, limit = 100 } = req.query;

    const stocks = await Stock.findByExchange(exchange, limit);

    res.json({
      success: true,
      count: stocks.length,
      data: stocks,
      exchange: exchange.toUpperCase(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;