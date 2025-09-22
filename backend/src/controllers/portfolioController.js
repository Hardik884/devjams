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

    // Get current stock data to calculate total value and holdings
    const Stock = require('../models/Stock');
    const holdings = [];
    let totalValue = 0;

    for (let i = 0; i < portfolio.assets.length; i++) {
      const symbol = portfolio.assets[i];
      const weight = portfolio.weights[i];
      const allocatedAmount = portfolio.currentBalance * weight;

      try {
        const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
        const currentPrice = stock?.price?.current || 0;
        const previousClose = stock?.price?.previousClose || currentPrice;
        const shares = allocatedAmount / (previousClose || 1);
        const currentValue = shares * currentPrice;

        holdings.push({
          id: `${symbol}_${i}`, // Generate a unique ID
          symbol,
          quantity: shares.toFixed(2),
          averagePrice: previousClose,
          currentValue: currentValue.toFixed(2),
          name: stock?.name || symbol
        });

        totalValue += currentValue;
      } catch (stockError) {
        // If stock data not available, use allocated amount
        holdings.push({
          id: `${symbol}_${i}`,
          symbol,
          quantity: 0,
          averagePrice: 0,
          currentValue: allocatedAmount.toFixed(2),
          name: symbol
        });
        totalValue += allocatedAmount;
      }
    }

    // Calculate P&L
    const totalGainLoss = totalValue - portfolio.initialBalance;
    const totalGainLossPercent = portfolio.initialBalance > 0 
      ? (totalGainLoss / portfolio.initialBalance) * 100 
      : 0;

    // Return portfolio with calculated values
    const portfolioData = {
      ...portfolio.toObject(),
      totalValue: totalValue.toFixed(2),
      totalGainLoss: totalGainLoss.toFixed(2),
      totalGainLossPercent: totalGainLossPercent.toFixed(2),
      holdings
    };

    res.json({
      success: true,
      data: portfolioData,
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
    const rawPortfolioData = parseExcelFile(req.file.path);
    
    // Extract symbols for price fetching
    const symbols = [...new Set(rawPortfolioData.map(item => item.symbol))];
    
    // Fetch current prices
    const currentPrices = await fetchCurrentPrices(symbols);
    
    // Calculate portfolio metrics from real transaction data
    const portfolioData = calculatePortfolioMetrics(rawPortfolioData, currentPrices);

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

    // Create new portfolio with real transaction data
    const portfolio = new Portfolio({
      name: portfolioName,
      description: description || '',
      userId: req.user.id,
      assets: portfolioData.assets,
      weights: portfolioData.weights,
      initialBalance: portfolioData.initialBalance,
      currentBalance: portfolioData.currentBalance,
      currency: 'INR', // Default to INR for Indian stocks
      metadata: {
        importedAt: new Date(),
        sourceFile: req.file.originalname,
        totalHoldings: portfolioData.holdings.length,
        rawTransactions: rawPortfolioData.length,
        totalReturn: portfolioData.totalReturn,
        totalReturnPct: portfolioData.totalReturnPct
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

/**
 * Get portfolio analytics and performance data
 */
const getPortfolioAnalytics = async (req, res, next) => {
  try {
    const { period = '1mo' } = req.query;
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

    logger.info(`📊 Generating analytics for portfolio: ${portfolio.name} (${period})`);

    // Get current stock data for all assets
    const Stock = require('../models/Stock');
    const holdings = [];
    let totalCurrentValue = 0;
    let totalInvestedValue = portfolio.initialBalance;

    for (let i = 0; i < portfolio.assets.length; i++) {
      const symbol = portfolio.assets[i];
      const weight = portfolio.weights[i];
      const allocatedAmount = totalInvestedValue * weight;

      try {
        // Get current stock data
        const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
        if (stock) {
          const currentPrice = stock.price?.current || 0;
          const previousClose = stock.price?.previousClose || currentPrice;
          const shares = allocatedAmount / previousClose; // Assuming we bought at previous close
          const currentValue = shares * currentPrice;
          const gainLoss = currentValue - allocatedAmount;
          const gainLossPercent = allocatedAmount > 0 ? (gainLoss / allocatedAmount) * 100 : 0;

          holdings.push({
            symbol,
            name: stock.name,
            weight: weight * 100, // Convert to percentage
            allocatedAmount,
            shares: shares.toFixed(2),
            purchasePrice: previousClose,
            currentPrice,
            currentValue,
            gainLoss,
            gainLossPercent,
            sector: stock.sector || 'Unknown',
          });

          totalCurrentValue += currentValue;
        } else {
          // Stock not found, use allocated amount as current value
          holdings.push({
            symbol,
            name: symbol,
            weight: weight * 100,
            allocatedAmount,
            shares: 0,
            purchasePrice: 0,
            currentPrice: 0,
            currentValue: allocatedAmount,
            gainLoss: 0,
            gainLossPercent: 0,
            sector: 'Unknown',
          });
          totalCurrentValue += allocatedAmount;
        }
      } catch (stockError) {
        logger.warn(`Failed to get stock data for ${symbol}:`, stockError.message);
      }
    }

    // Calculate overall portfolio performance
    const totalGainLoss = totalCurrentValue - totalInvestedValue;
    const totalGainLossPercent = totalInvestedValue > 0 ? (totalGainLoss / totalInvestedValue) * 100 : 0;

    // Generate sector allocation
    const sectorAllocation = holdings.reduce((acc, holding) => {
      const sector = holding.sector || 'Unknown';
      if (!acc[sector]) {
        acc[sector] = { value: 0, percentage: 0 };
      }
      acc[sector].value += holding.currentValue;
      return acc;
    }, {});

    // Calculate sector percentages
    Object.keys(sectorAllocation).forEach(sector => {
      sectorAllocation[sector].percentage = totalCurrentValue > 0 
        ? (sectorAllocation[sector].value / totalCurrentValue) * 100 
        : 0;
    });

    // Generate simple timeline data (for now, just current snapshot)
    // In a real implementation, you'd fetch historical portfolio values
    const timeline = [
      {
        date: new Date(portfolio.createdAt),
        value: totalInvestedValue,
        gainLoss: 0,
        gainLossPercent: 0
      },
      {
        date: new Date(),
        value: totalCurrentValue,
        gainLoss: totalGainLoss,
        gainLossPercent: totalGainLossPercent
      }
    ];

    const analytics = {
      performance: {
        totalInvested: totalInvestedValue,
        currentValue: totalCurrentValue,
        totalGainLoss,
        totalGainLossPercent,
        bestPerformer: holdings.reduce((best, holding) => 
          holding.gainLossPercent > (best?.gainLossPercent || -Infinity) ? holding : best, null),
        worstPerformer: holdings.reduce((worst, holding) => 
          holding.gainLossPercent < (worst?.gainLossPercent || Infinity) ? holding : worst, null),
      },
      allocation: {
        byStock: holdings.map(h => ({
          symbol: h.symbol,
          name: h.name,
          percentage: h.weight,
          value: h.currentValue
        })),
        bySector: Object.entries(sectorAllocation).map(([sector, data]) => ({
          sector,
          percentage: data.percentage,
          value: data.value
        }))
      },
      holdings,
      timeline,
      metadata: {
        portfolioName: portfolio.name,
        createdAt: portfolio.createdAt,
        lastUpdated: new Date(),
        period,
        numberOfAssets: holdings.length
      }
    };

    res.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    logger.error('Portfolio analytics error:', error);
    next(error);
  }
};

module.exports = {
  getPortfolios,
  createPortfolio,
  getPortfolioById,
  getPortfolioAnalytics,
  updatePortfolio,
  deletePortfolio,
  rebalancePortfolio,
  importPortfolio,
};