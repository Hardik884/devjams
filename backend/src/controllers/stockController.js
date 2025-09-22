const Stock = require('../models/Stock');
const stockDataService = require('../services/stockDataService');
const logger = require('../utils/logger');

/**
 * Get trending stocks
 */
const getTrendingStocks = async (req, res, next) => {
  try {
    const limit = req.query.limit || 50;

    // Try to get from database first
    let dataSource = 'database'; // Track data source
    let trendingStocks = await Stock.getTrendingStocks(limit);

    // If database is empty or data is stale, fetch from external API
    // Temporarily set to 1 minute for fresh data (change back to 15 * 60 * 1000 later)
    const isStale = trendingStocks.length === 0 || 
        (trendingStocks[0] && new Date() - trendingStocks[0].lastUpdated > 1 * 60 * 1000);

    if (isStale) {
      logger.info('Fetching fresh trending stocks data from external API');
      
      try {
        const freshData = await stockDataService.fetchTrendingStocks();
        
        // Update database with fresh data, preserving existing market cap if API doesn't provide it
        for (const stockData of freshData) {
          const existingStock = await Stock.findOne({ symbol: stockData.symbol });
          
          const updateData = {
            ...stockData,
            isActive: true,
            lastUpdated: new Date(),
          };
          
          // Preserve existing market cap if Yahoo Finance doesn't provide it
          if (stockData.marketCap === null && existingStock?.marketCap) {
            updateData.marketCap = existingStock.marketCap;
            logger.info(`📊 Preserved existing market cap for ${stockData.symbol}: ₹${(existingStock.marketCap / 10000000).toFixed(2)} Cr`);
          }
          
          await Stock.findOneAndUpdate(
            { symbol: stockData.symbol },
            updateData,
            { upsert: true, new: true }
          );
        }

        trendingStocks = await Stock.getTrendingStocks(limit);
        dataSource = 'yahoo_finance_api';
        logger.info('✅ Successfully updated trending stocks from Yahoo Finance API');
      } catch (apiError) {
        logger.error('❌ Error fetching trending stocks from API:', apiError.message);
        // If API fails, return whatever we have in database
        if (trendingStocks.length === 0) {
          return res.status(503).json({
            success: false,
            error: 'Unable to fetch trending stocks data',
          });
        }
        dataSource = 'database_stale';
        logger.warn('⚠️ Using stale database data for trending stocks');
      }
    } else {
      const ageInMinutes = Math.round((new Date() - trendingStocks[0].lastUpdated) / 1000 / 60);
      logger.info(`📋 Using cached trending stocks data (${ageInMinutes}min old)`);
    }

    res.json({
      success: true,
      count: trendingStocks.length,
      data: trendingStocks,
      meta: {
        dataSource,
        lastUpdated: trendingStocks[0]?.lastUpdated,
        ageInMinutes: trendingStocks[0] ? Math.round((new Date() - trendingStocks[0].lastUpdated) / 1000 / 60) : 0,
        cacheExpiry: '1 minute (testing mode)'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search stocks by symbol or name
 */
const searchStocks = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    // First, search in our database
    const databaseResults = await Stock.searchStocks(q, limit);

    // If query looks like a stock symbol (short, uppercase) and we have few results,
    // try to fetch it directly from the API
    let externalResult = null;
    const isLikelySymbol = q && q.length >= 2 && q.length <= 10 && /^[A-Z0-9]+$/i.test(q);
    
    if (isLikelySymbol && databaseResults.length < 3) {
      try {
        logger.info(`Searching for stock symbol: ${q.toUpperCase()}`);
        
        // Try to fetch stock data from external API
        const stockData = await stockDataService.getCompleteStockData(q.toUpperCase());
        
        if (stockData && stockData.symbol) {
          // Check if this stock already exists in our database
          const existingStock = await Stock.findOne({ symbol: stockData.symbol });
          
          if (!existingStock) {
            // Add this new stock to our database with complete data
            const newStock = await Stock.create({
              ...stockData,
              isActive: true,
              lastUpdated: new Date(),
            });
            
            // Fetch and store historical data in background (don't wait for it)
            setImmediate(async () => {
              try {
                logger.info(`📊 Fetching historical data for newly discovered stock: ${stockData.symbol}`);
                
                // Fetch multiple periods of historical data
                const periods = ['1mo', '3mo', '6mo', '1y'];
                for (const period of periods) {
                  await stockDataService.fetchHistoricalPrices(stockData.symbol, period);
                }
                
                // Fetch technical indicators
                await stockDataService.fetchTechnicalIndicators(stockData.symbol);
                
                logger.info(`✅ Background data fetch completed for ${stockData.symbol}`);
              } catch (bgError) {
                logger.warn(`⚠️ Background data fetch failed for ${stockData.symbol}:`, bgError.message);
              }
            });
            
            externalResult = newStock;
            logger.info(`✅ Added new Indian stock to database: ${stockData.symbol}`);
          }
        }
      } catch (apiError) {
        logger.warn(`Could not fetch external stock data for ${q}:`, apiError.message);
        // Don't throw error, just continue with database results
      }
    }

    // Combine results, avoiding duplicates
    let allResults = [...databaseResults];
    if (externalResult && !databaseResults.find(stock => stock.symbol === externalResult.symbol)) {
      allResults.unshift(externalResult); // Add at the beginning
    }

    // Limit final results
    allResults = allResults.slice(0, limit);

    res.json({
      success: true,
      count: allResults.length,
      data: allResults,
      query: q,
      sources: {
        database: databaseResults.length,
        external: externalResult ? 1 : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top performing stocks
 */
const getTopPerformers = async (req, res, next) => {
  try {
    const { period = '1D', limit = 20, sortBy = 'return' } = req.query;

    // Map period to timeframe expected by model
    const timeframeMap = {
      '1D': 'oneDay',
      '1W': 'oneWeek', 
      '1M': 'oneMonth',
      '3M': 'threeMonths',
      '6M': 'sixMonths',
      '1Y': 'oneYear'
    };

    const timeframe = timeframeMap[period] || 'oneDay';

    const topPerformers = await Stock.getTopPerformers(timeframe, parseInt(limit));
    
    // Determine data freshness
    const oldestStock = topPerformers.reduce((oldest, stock) => {
      return (!oldest || stock.lastUpdated < oldest.lastUpdated) ? stock : oldest;
    }, null);
    
    const dataSource = oldestStock && (new Date() - oldestStock.lastUpdated) < 5 * 60 * 1000 ? 'recent_database' : 'database';
    const ageInMinutes = oldestStock ? Math.round((new Date() - oldestStock.lastUpdated) / 1000 / 60) : 0;

    res.json({
      success: true,
      count: topPerformers.length,
      data: topPerformers,
      period,
      sortBy,
      meta: {
        dataSource,
        oldestDataAge: ageInMinutes,
        note: 'This endpoint shows cached database data. Returns are calculated from historical price changes.'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock details by symbol
 */
const getStockBySymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    let dataSource = 'database'; // Track data source

    let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    const isStale = stock && (new Date() - stock.lastUpdated > 5 * 60 * 1000);

    // If stock not found in database or data is stale, fetch from API
    if (!stock || isStale) {
      logger.info(`Fetching fresh data for stock ${symbol} - ${!stock ? 'not found' : 'data stale'}`);
      
      try {
        const stockData = await stockDataService.getCompleteStockData(symbol);
        const existingStock = stock; // Keep reference to existing data
        
        const updateData = {
          ...stockData,
          isActive: true,
          lastUpdated: new Date(),
        };
        
        // Preserve existing market cap if Yahoo Finance doesn't provide it
        if (stockData.marketCap === null && existingStock?.marketCap) {
          updateData.marketCap = existingStock.marketCap;
          logger.info(`📊 Preserved existing market cap for ${symbol}: ₹${(existingStock.marketCap / 10000000).toFixed(2)} Cr`);
        }
        
        stock = await Stock.findOneAndUpdate(
          { symbol: symbol.toUpperCase() },
          updateData,
          { upsert: true, new: true }
        );
        
        // If this is a new stock (upsert created it), fetch background data
        if (!existingStock) {
          setImmediate(async () => {
            try {
              logger.info(`📊 Fetching comprehensive data for newly discovered stock: ${symbol}`);
              
              // Fetch multiple periods of historical data
              const periods = ['1mo', '3mo', '6mo', '1y'];
              for (const period of periods) {
                await stockDataService.fetchHistoricalPrices(symbol, period);
              }
              
              // Fetch technical indicators
              await stockDataService.fetchTechnicalIndicators(symbol);
              
              logger.info(`✅ Background comprehensive data fetch completed for ${symbol}`);
            } catch (bgError) {
              logger.warn(`⚠️ Background data fetch failed for ${symbol}:`, bgError.message);
            }
          });
        }
        
        dataSource = 'yahoo_finance_api'; // Data came from API
        logger.info(`✅ Successfully fetched fresh data for ${symbol} from Yahoo Finance`);
      } catch (apiError) {
        logger.error(`❌ Error fetching stock data for ${symbol}:`, apiError.message);
        
        if (!stock) {
          return res.status(404).json({
            success: false,
            error: 'Stock not found',
          });
        }
        // Continue with stale data if API fails
        dataSource = 'database_stale';
        logger.warn(`⚠️ Using stale database data for ${symbol}`);
      }
    } else {
      logger.info(`📋 Using cached database data for ${symbol} (${Math.round((new Date() - stock.lastUpdated) / 1000 / 60)}min old)`);
    }

    res.json({
      success: true,
      data: stock,
      meta: {
        dataSource,
        lastUpdated: stock.lastUpdated,
        ageInMinutes: Math.round((new Date() - stock.lastUpdated) / 1000 / 60),
        cacheExpiry: '5 minutes'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get technical analysis for a stock
 */
const getStockTechnicals = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1D', indicators = 'RSI,MACD,SMA' } = req.query;

    const technicalData = await stockDataService.fetchTechnicalIndicators(symbol);

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      period,
      data: technicalData,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }
    next(error);
  }
};

/**
 * Get user's watchlist
 */
const getWatchlist = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.watchlist || user.watchlist.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const watchlistStocks = await Stock.find({
      symbol: { $in: user.watchlist }
    });

    res.json({
      success: true,
      count: watchlistStocks.length,
      data: watchlistStocks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add stock to watchlist
 */
const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    const user = req.user;

    // Verify stock exists
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }

    // Check if already in watchlist
    if (user.watchlist && user.watchlist.includes(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Stock already in watchlist',
      });
    }

    // Add to watchlist
    user.watchlist = user.watchlist || [];
    user.watchlist.push(symbol.toUpperCase());
    await user.save();

    res.json({
      success: true,
      message: 'Stock added to watchlist',
      symbol: symbol.toUpperCase(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available exchanges
 */
const getExchanges = async (req, res, next) => {
  try {
    const { country } = req.query;

    const exchanges = await Stock.getExchanges(country);

    res.json({
      success: true,
      count: exchanges.length,
      data: exchanges,
      country: country || 'all',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical price data for a stock
 */
const getStockHistoricalData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo', interval = '1d' } = req.query;

    logger.info(`Fetching historical data for ${symbol} (${period}, ${interval})`);

    // Get historical data from the service
    const historicalData = await stockDataService.fetchHistoricalPrices(symbol, period, interval);

    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No historical data found for this stock',
      });
    }

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      period,
      interval,
      count: historicalData.length,
      data: historicalData,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }
    next(error);
  }
};

/**
 * Refresh comprehensive data for a stock
 */
const refreshStockData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    logger.info(`🔄 Manual refresh requested for stock: ${symbol}`);

    // Check if stock exists
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found in database',
      });
    }

    // Respond immediately
    res.json({
      success: true,
      message: 'Data refresh initiated in background',
      symbol: symbol.toUpperCase(),
    });

    // Start comprehensive data refresh in background
    setImmediate(async () => {
      try {
        logger.info(`📊 Starting comprehensive refresh for ${symbol}`);
        
        // 1. Refresh current stock data
        const stockData = await stockDataService.getCompleteStockData(symbol);
        if (stockData) {
          await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { ...stockData, lastUpdated: new Date() },
            { new: true }
          );
          logger.info(`✅ Updated current data for ${symbol}`);
        }

        // 2. Fetch historical data for multiple periods
        const periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', 'max'];
        for (const period of periods) {
          try {
            await stockDataService.fetchHistoricalPrices(symbol, period);
            logger.info(`✅ Fetched ${period} historical data for ${symbol}`);
          } catch (periodError) {
            logger.warn(`⚠️ Failed to fetch ${period} data for ${symbol}:`, periodError.message);
          }
        }

        // 3. Fetch technical indicators
        try {
          await stockDataService.fetchTechnicalIndicators(symbol);
          logger.info(`✅ Updated technical indicators for ${symbol}`);
        } catch (techError) {
          logger.warn(`⚠️ Failed to fetch technical data for ${symbol}:`, techError.message);
        }

        logger.info(`🎉 Comprehensive refresh completed for ${symbol}`);
      } catch (refreshError) {
        logger.error(`❌ Comprehensive refresh failed for ${symbol}:`, refreshError.message);
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrendingStocks,
  searchStocks,
  getTopPerformers,
  getStockBySymbol,
  getStockTechnicals,
  getStockHistoricalData,
  refreshStockData,
  getWatchlist,
  addToWatchlist,
  getExchanges,
};