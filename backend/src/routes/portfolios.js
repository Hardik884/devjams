const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Portfolio:
 *       type: object
 *       required:
 *         - name
 *         - assets
 *         - weights
 *         - initialBalance
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         assets:
 *           type: array
 *           items:
 *             type: string
 *         weights:
 *           type: array
 *           items:
 *             type: number
 *         initialBalance:
 *           type: number
 *         currentBalance:
 *           type: number
 *         currency:
 *           type: string
 *         isActive:
 *           type: boolean
 *         riskProfile:
 *           type: object
 *         constraints:
 *           type: object
 *         performance:
 *           type: object
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: Get user's portfolios
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of portfolios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Portfolio'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user.id };
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const portfolios = await Portfolio.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Portfolio.countDocuments(filter);

    res.json({
      success: true,
      data: portfolios,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/portfolios:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assets
 *               - weights
 *               - initialBalance
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *               weights:
 *                 type: array
 *                 items:
 *                   type: number
 *               initialBalance:
 *                 type: number
 *               currency:
 *                 type: string
 *               riskProfile:
 *                 type: object
 *               constraints:
 *                 type: object
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('assets').isArray({ min: 1 }).withMessage('At least one asset is required'),
  body('assets.*').notEmpty().withMessage('Asset symbols cannot be empty'),
  body('weights').isArray({ min: 1 }).withMessage('Weights array is required'),
  body('weights.*').isFloat({ min: 0, max: 1 }).withMessage('Weights must be between 0 and 1'),
  body('initialBalance').isFloat({ gt: 0 }).withMessage('Initial balance must be positive'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
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

    const {
      name,
      description,
      assets,
      weights,
      initialBalance,
      currency,
      riskProfile,
      constraints,
      metadata,
    } = req.body;

    // Validate that assets and weights arrays have the same length
    if (assets.length !== weights.length) {
      return res.status(400).json({
        success: false,
        error: 'Number of assets must match number of weights',
      });
    }

    // Validate that weights sum to 1.0
    const weightsSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightsSum - 1.0) > 0.001) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio weights must sum to 1.0',
      });
    }

    // Check for duplicate portfolio name for this user
    const existingPortfolio = await Portfolio.findOne({
      userId: req.user.id, 
      name,
    });

    if (existingPortfolio) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio with this name already exists',
      });
    }

    // Create portfolio
    const portfolio = new Portfolio({
      name,
      description: description || '',
      userId: req.user.id,
      assets,
      weights,
      initialBalance,
      currency: currency || 'USD',
      riskProfile: riskProfile || {},
      constraints: constraints || {},
      metadata: metadata || {},
    });

    await portfolio.save();

    logger.info(`Portfolio created: ${name} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: Get portfolio by ID
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio details
 *       404:
 *         description: Portfolio not found
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
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

    const portfolio = await Portfolio.findOne({
      _id: req.params.id, 
      userId: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
      });
    }

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/portfolios/{id}:
 *   put:
 *     summary: Update portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               weights:
 *                 type: array
 *                 items:
 *                   type: number
 *               riskProfile:
 *                 type: object
 *               constraints:
 *                 type: object
 *     responses:
 *       200:
 *         description: Portfolio updated successfully
 *       404:
 *         description: Portfolio not found
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('weights').optional().isArray({ min: 1 }),
  body('weights.*').optional().isFloat({ min: 0, max: 1 }),
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

    const portfolio = await Portfolio.findOne({
      _id: req.params.id, 
      userId: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
      });
    }

    const { name, description, weights, riskProfile, constraints } = req.body;

    // Validate weights if provided
    if (weights) {
      if (weights.length !== portfolio.assets.length) {
        return res.status(400).json({
          success: false,
          error: 'Weights array length must match number of assets',
        });
      }

      const weightsSum = weights.reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(weightsSum - 1.0) > 0.001) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio weights must sum to 1.0',
        });
      }

      portfolio.updateWeights(weights);
    }

    // Update other fields
    if (name) portfolio.name = name;
    if (description !== undefined) portfolio.description = description;
    if (riskProfile) portfolio.riskProfile = { ...portfolio.riskProfile, ...riskProfile };
    if (constraints) portfolio.constraints = { ...portfolio.constraints, ...constraints };

    await portfolio.save();

    logger.info(`Portfolio updated: ${portfolio.name} by user ${req.user.email}`);

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/portfolios/{id}:
 *   delete:
 *     summary: Delete portfolio (soft delete)
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio deleted successfully
 *       404:
 *         description: Portfolio not found
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
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

    const portfolio = await Portfolio.findOne({
      _id: req.params.id, 
      userId: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
      });
    }

    // Soft delete
    portfolio.isActive = false;
    await portfolio.save();

    logger.info(`Portfolio deleted: ${portfolio.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/portfolios/{id}/rebalance:
 *   post:
 *     summary: Trigger portfolio rebalancing
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rebalancing completed
 *       404:
 *         description: Portfolio not found
 */
router.post('/:id/rebalance', [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
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

    const portfolio = await Portfolio.findOne({
      _id: req.params.id, 
      userId: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
      });
    }

    // Here we would integrate with the ML backend
    // For now, return a mock response
    const allocation = portfolio.getAssetAllocation();

    res.json({
      success: true,
      data: {
        portfolioId: portfolio._id,
        currentAllocation: allocation,
        recommendedWeights: portfolio.weights, // Mock - would come from ML service
        rebalanceDate: new Date(),
        message: 'Portfolio rebalancing completed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;