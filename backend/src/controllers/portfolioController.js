const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const logger = require('../utils/logger');
const { parseExcelFile, fetchCurrentPrices, calculatePortfolioMetrics } = require('../services/portfolioImport');

/**
 * Get all portfolios for the authenticated user
 */
const getPortfolios = async (req, res, next) => {
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
};

/**
 * Create a new portfolio
 */
const createPortfolio = async (req, res, next) => {
  try {
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
      currentBalance: currentBalance || initialBalance,
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
};

/**
 * Get portfolio by ID
 */
const getPortfolioById = async (req, res, next) => {
  try {
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
};

/**
 * Update portfolio by ID
 */
const updatePortfolio = async (req, res, next) => {
  try {
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
      isActive,
    } = req.body;

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

    // If updating assets and weights, validate them
    if (assets && weights) {
      if (assets.length !== weights.length) {
        return res.status(400).json({
          success: false,
          error: 'Number of assets must match number of weights',
        });
      }

      const weightsSum = weights.reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(weightsSum - 1.0) > 0.001) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio weights must sum to 1.0',
        });
      }
    }

    // Check for duplicate portfolio name if name is being updated
    if (name && name !== portfolio.name) {
      const existingPortfolio = await Portfolio.findOne({
        userId: req.user.id,
        name,
        _id: { $ne: req.params.id },
      });

      if (existingPortfolio) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio with this name already exists',
        });
      }
    }

    // Update portfolio fields
    if (name !== undefined) portfolio.name = name;
    if (description !== undefined) portfolio.description = description;
    if (assets !== undefined) portfolio.assets = assets;
    if (weights !== undefined) portfolio.weights = weights;
    if (initialBalance !== undefined) portfolio.initialBalance = initialBalance;
    if (currentBalance !== undefined) portfolio.currentBalance = currentBalance;
    if (currency !== undefined) portfolio.currency = currency;
    if (riskProfile !== undefined) portfolio.riskProfile = riskProfile;
    if (constraints !== undefined) portfolio.constraints = constraints;
    if (metadata !== undefined) portfolio.metadata = metadata;
    if (isActive !== undefined) portfolio.isActive = isActive;

    portfolio.updatedAt = new Date();
    await portfolio.save();

    logger.info(`Portfolio updated: ${portfolio.name} by user ${req.user.email}`);

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete portfolio by ID
 */
const deletePortfolio = async (req, res, next) => {
  try {
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

    await Portfolio.findByIdAndDelete(req.params.id);

    logger.info(`Portfolio deleted: ${portfolio.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rebalance portfolio
 */
const rebalancePortfolio = async (req, res, next) => {
  try {
    const { newWeights, targetValue } = req.body;

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

    if (newWeights && newWeights.length !== portfolio.assets.length) {
      return res.status(400).json({
        success: false,
        error: 'Number of new weights must match number of assets',
      });
    }

    if (newWeights) {
      const weightsSum = newWeights.reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(weightsSum - 1.0) > 0.001) {
        return res.status(400).json({
          success: false,
          error: 'New weights must sum to 1.0',
        });
      }
    }

    // Calculate rebalancing recommendations
    const currentPrices = await fetchCurrentPrices(portfolio.assets);
    const rebalanceData = calculatePortfolioMetrics(portfolio, currentPrices, {
      newWeights,
      targetValue,
    });

    // Update portfolio with new weights if provided
    if (newWeights) {
      portfolio.weights = newWeights;
      portfolio.updatedAt = new Date();
      await portfolio.save();
    }

    logger.info(`Portfolio rebalanced: ${portfolio.name} by user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        portfolio,
        rebalanceRecommendations: rebalanceData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import portfolio from file
 */
const importPortfolio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { portfolioName, description } = req.body;

    // Parse the uploaded file
    const portfolioData = await parseExcelFile(req.file.path);

    // Validate portfolio data
    if (!portfolioData.assets || !portfolioData.weights || portfolioData.assets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid portfolio file format',
      });
    }

    // Check for duplicate portfolio name
    const existingPortfolio = await Portfolio.findOne({
      userId: req.user.id,
      name: portfolioName,
    });

    if (existingPortfolio) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio with this name already exists',
      });
    }

    // Create new portfolio
    const portfolio = new Portfolio({
      name: portfolioName,
      description: description || '',
      userId: req.user.id,
      assets: portfolioData.assets,
      weights: portfolioData.weights,
      initialBalance: portfolioData.totalValue || 10000,
      currentBalance: portfolioData.totalValue || 10000,
      currency: portfolioData.currency || 'USD',
      metadata: {
        importedAt: new Date(),
        sourceFile: req.file.originalname,
      },
    });

    await portfolio.save();

    logger.info(`Portfolio imported: ${portfolioName} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: portfolio,
      message: 'Portfolio imported successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolios,
  createPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  rebalancePortfolio,
  importPortfolio,
};