const express = require('express');
const { validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getWishlist,
  addStockToWishlist,
  removeStockFromWishlist,
  updateStockInWishlist,
  updateWishlistSettings,
} = require('../controllers/wishlistController');
const {
  addStockValidation,
  removeStockValidation,
  updateStockValidation,
  updateWishlistValidation,
} = require('../validators/wishlistValidators');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// All routes are protected
router.use(protect);

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
 *         currentPrice:
 *           type: number
 *           description: Current stock price
 *         priceChange:
 *           type: number
 *           description: Price change from previous close
 *         priceChangePercent:
 *           type: string
 *           description: Percentage price change
 *         targetPriceStatus:
 *           type: string
 *           enum: [reached, pending]
 *           description: Target price status
 *         targetPriceDistance:
 *           type: string
 *           description: Distance to target price in percentage
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
 *         userId:
 *           type: string
 *           description: User ID who owns the wishlist
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's wishlist with stock details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist not found
 */
router.get('/', getWishlist);

/**
 * @swagger
 * /api/wishlist/stocks:
 *   post:
 *     summary: Add stock to wishlist
 *     tags: [Wishlist]
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
 *     responses:
 *       201:
 *         description: Stock added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Stock already in wishlist
 */
router.post('/stocks', addStockValidation, handleValidationErrors, addStockToWishlist);

/**
 * @swagger
 * /api/wishlist/stocks/{symbol}:
 *   delete:
 *     summary: Remove stock from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol to remove
 *     responses:
 *       200:
 *         description: Stock removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist or stock not found
 */
router.delete('/stocks/:symbol', removeStockValidation, handleValidationErrors, removeStockFromWishlist);

/**
 * @swagger
 * /api/wishlist/stocks/{symbol}:
 *   put:
 *     summary: Update stock in wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Stock updated in wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist or stock not found
 */
router.put('/stocks/:symbol', updateStockValidation, handleValidationErrors, updateStockInWishlist);

/**
 * @swagger
 * /api/wishlist:
 *   put:
 *     summary: Update wishlist settings
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 */
router.put('/', updateWishlistValidation, handleValidationErrors, updateWishlistSettings);

module.exports = router;