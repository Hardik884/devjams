const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Stock = require('../models/Stock');
const { protect: auth } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           description: Stock symbol
 *         notes:
 *           type: string
 *           description: Personal notes about the stock
 *         targetPrice:
 *           type: number
 *           description: Target price for the stock
 *         alertPrice:
 *           type: number
 *           description: Price alert threshold
 *     Wishlist:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Wishlist name
 *         description:
 *           type: string
 *           description: Wishlist description
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *         isPublic:
 *           type: boolean
 *           description: Whether wishlist is public
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's wishlist with stock details
 *       404:
 *         description: Wishlist not found
 */
router.get('/', auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findByUser(req.user.id);
    
    if (!wishlist) {
      // Create default wishlist for user
      wishlist = await Wishlist.createForUser(req.user.id);
    }

    // Populate stock details for each item
    await wishlist.populate('items.stock');

    // Add current stock prices and calculate performance
    const enrichedItems = await Promise.all(
      wishlist.items.map(async (item) => {
        const stock = item.stock;
        if (!stock) return item;

        const itemObj = item.toObject();
        itemObj.currentPrice = stock.price?.current || 0;
        itemObj.priceChange = stock.price?.current - stock.price?.previousClose || 0;
        itemObj.priceChangePercent = stock.price?.previousClose 
          ? ((stock.price.current - stock.price.previousClose) / stock.price.previousClose * 100).toFixed(2)
          : 0;
        
        // Calculate target price status
        if (itemObj.targetPrice) {
          itemObj.targetPriceStatus = itemObj.currentPrice >= itemObj.targetPrice ? 'reached' : 'pending';
          itemObj.targetPriceDistance = ((itemObj.targetPrice - itemObj.currentPrice) / itemObj.currentPrice * 100).toFixed(2);
        }

        return itemObj;
      })
    );

    res.json({
      success: true,
      data: {
        ...wishlist.toObject(),
        items: enrichedItems,
      },
    });
  } catch (error) {
    logger.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/wishlist/stocks:
 *   post:
 *     summary: Add stock to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
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
 *                 example: RELIANCE
 *               notes:
 *                 type: string
 *                 example: Strong fundamentals
 *               targetPrice:
 *                 type: number
 *                 example: 2500
 *               alertPrice:
 *                 type: number
 *                 example: 2400
 */
router.post('/stocks', [
  auth,
  body('symbol').notEmpty().withMessage('Stock symbol is required').isString(),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive'),
  body('alertPrice').optional().isFloat({ min: 0 }).withMessage('Alert price must be positive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { symbol, notes, targetPrice, alertPrice } = req.body;

    // Check if stock exists in our database
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Indian stock ${symbol.toUpperCase()} not found in our database`,
      });
    }

    // Get or create user's wishlist
    let wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      wishlist = await Wishlist.createForUser(req.user.id);
    }

    // Add stock to wishlist
    await wishlist.addStock({
      stockId: stock._id,
      symbol: symbol.toUpperCase(),
      notes,
      targetPrice,
      alertPrice,
    });

    // Return the updated wishlist
    await wishlist.populate('items.stock');

    res.status(201).json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} added to wishlist successfully`,
      data: wishlist,
    });

  } catch (error) {
    logger.error('Error adding stock to wishlist:', error);
    
    if (error.message.includes('already in your wishlist')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding stock to wishlist',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/wishlist/stocks/{symbol}:
 *   delete:
 *     summary: Remove stock from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol to remove
 */
router.delete('/stocks/:symbol', [
  auth,
  param('symbol').notEmpty().withMessage('Stock symbol is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { symbol } = req.params;

    const wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    await wishlist.removeStock(symbol);

    res.json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} removed from wishlist successfully`,
      data: wishlist,
    });

  } catch (error) {
    logger.error('Error removing stock from wishlist:', error);
    
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error removing stock from wishlist',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/wishlist/stocks/{symbol}:
 *   put:
 *     summary: Update stock in wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *               alertPrice:
 *                 type: number
 */
router.put('/stocks/:symbol', [
  auth,
  param('symbol').notEmpty().withMessage('Stock symbol is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive'),
  body('alertPrice').optional().isFloat({ min: 0 }).withMessage('Alert price must be positive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { symbol } = req.params;
    const updateData = req.body;

    const wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    await wishlist.updateItem(symbol, updateData);
    await wishlist.populate('items.stock');

    res.json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} updated in wishlist successfully`,
      data: wishlist,
    });

  } catch (error) {
    logger.error('Error updating stock in wishlist:', error);
    
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating stock in wishlist',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/wishlist:
 *   put:
 *     summary: Update wishlist settings
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.put('/', [
  auth,
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    let wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      wishlist = await Wishlist.createForUser(req.user.id, req.body);
    } else {
      Object.assign(wishlist, req.body);
      await wishlist.save();
    }

    res.json({
      success: true,
      message: 'Wishlist updated successfully',
      data: wishlist,
    });

  } catch (error) {
    logger.error('Error updating wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating wishlist',
      error: error.message,
    });
  }
});

module.exports = router;