const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');
const { uploadPortfolioFile, handleUploadError, cleanupFile } = require('../middleware/fileUpload');
const { parseExcelFile, fetchCurrentPrices, calculatePortfolioMetrics } = require('../services/portfolioImport');

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
      currentBalance,
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
      currentBalance: currentBalance || initialBalance, // Use provided currentBalance or default to initialBalance
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

/**
 * @swagger
 * /api/portfolios/import:
 *   post:
 *     summary: Import portfolio from Excel file
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               portfolioFile:
 *                 type: string
 *                 format: binary
 *                 description: Excel file with portfolio data (.xlsx, .xls, .csv)
 *               name:
 *                 type: string
 *                 description: Portfolio name
 *               description:
 *                 type: string
 *                 description: Portfolio description
 *     responses:
 *       201:
 *         description: Portfolio imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Portfolio'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAssets:
 *                       type: number
 *                     totalValue:
 *                       type: number
 *                     totalReturn:
 *                       type: number
 *                     totalReturnPct:
 *                       type: number
 *       400:
 *         description: Invalid file or data format
 */
router.post('/import', uploadPortfolioFile, handleUploadError, async (req, res, next) => {


  let filePath = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload an Excel file (.xlsx, .xls) or CSV file.',
      });
    }
    
    filePath = req.file.path;
    const { name, description } = req.body;
    
    // Validate portfolio name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio name is required and must be at least 2 characters.',
      });
    }
    
    // Check for duplicate portfolio name
    const existingPortfolio = await Portfolio.findOne({
      userId: req.user.id,
      name: name.trim(),
    });
    
    if (existingPortfolio) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio with this name already exists.',
      });
    }
    
    // Parse Excel file
    logger.info(`Parsing portfolio file: ${req.file.originalname}`);
    const portfolioData = parseExcelFile(filePath);
    
    if (portfolioData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid portfolio data found in the file.',
      });
    }
    
    // Extract unique symbols
    const symbols = [...new Set(portfolioData.map(item => item.symbol))];
    
    // Fetch current prices
    logger.info(`Fetching current prices for ${symbols.length} symbols: ${symbols.join(', ')}`);
    const currentPrices = await fetchCurrentPrices(symbols);
    
    // Check if we got prices for all symbols
    const missingPrices = symbols.filter(symbol => currentPrices[symbol] === null);
    if (missingPrices.length > 0) {
      logger.warn(`Could not fetch prices for: ${missingPrices.join(', ')}`);
    }
    
    // Calculate portfolio metrics
    const metrics = calculatePortfolioMetrics(portfolioData, currentPrices);
    
    // Create portfolio
    const portfolio = new Portfolio({
      name: name.trim(),
      description: description?.trim() || '',
      userId: req.user.id,
      assets: metrics.assets,
      weights: metrics.weights,
      initialBalance: metrics.initialBalance,
      currentBalance: metrics.currentBalance,
      currency: 'USD', // Default to USD, can be made configurable
      metadata: {
        createdVia: 'excel-import',
        importedAt: new Date(),
        originalFileName: req.file.originalname,
        holdings: metrics.holdings,
        importSummary: {
          totalAssets: metrics.assets.length,
          totalHoldings: portfolioData.length,
          missingPrices: missingPrices,
          totalReturn: metrics.totalReturn,
          totalReturnPct: metrics.totalReturnPct,
        }
      },
    });
    
    await portfolio.save();
    
    logger.info(`Portfolio imported successfully: ${name} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      data: portfolio,
      summary: {
        totalAssets: metrics.assets.length,
        totalValue: metrics.currentBalance,
        totalReturn: metrics.totalReturn,
        totalReturnPct: metrics.totalReturnPct,
        missingPrices: missingPrices,
        holdings: metrics.holdings,
      },
    });
    
  } catch (error) {
    logger.error('Portfolio import error:', error);
    
    // Return specific error messages for common issues
    if (error.message.includes('parse')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format or structure. Please check your Excel file.',
        details: error.message,
      });
    }
    
    if (error.message.includes('fetch')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch current stock prices. Please try again later.',
        details: error.message,
      });
    }
    
    next(error);
  } finally {
    // Clean up uploaded file
    if (filePath) {
      cleanupFile(filePath);
    }
  }
});

module.exports = router;