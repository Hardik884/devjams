const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Indian Stock Data Service - fetches real-time data for Indian market only
 * All data in INR currency, supports NSE and BSE exchanges
 */
class IndianStockDataService {
  constructor() {
    this.baseURLs = {
      yahoo: 'https://query1.finance.yahoo.com',
      alphavantage: 'https://www.alphavantage.co/query',
      nse: 'https://www.nseindia.com/api',
    };
    
    this.apiKeys = {
      alphavantage: process.env.ALPHA_VANTAGE_API_KEY,
    };

    // Default market configuration for India
    this.marketConfig = {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      country: 'IN',
      tradingHours: {
        start: '09:15',
        end: '15:30'
      }
    };

    // Indian market suffixes for Yahoo Finance
    this.exchangeSuffixes = {
      NSE: '.NS',  // National Stock Exchange (Primary)
      BSE: '.BO',  // Bombay Stock Exchange (Secondary)
    };

    // Popular Indian stocks for trending and database population
    this.popularIndianStocks = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
      'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'SBIN', 'ASIANPAINT',
      'AXISBANK', 'MARUTI', 'TITAN', 'NESTLEIND', 'HCLTECH', 'WIPRO',
      'ULTRACEMCO', 'BAJFINANCE', 'POWERGRID', 'NTPC', 'TECHM', 'M&M',
      'SUNPHARMA', 'ONGC', 'TATASTEEL', 'INDUSINDBK', 'GRASIM', 'DRREDDY',
      'BAJAJFINSV', 'EICHERMOT', 'BRITANNIA', 'DIVISLAB', 'CIPLA', 'COALINDIA',
      'HINDALCO', 'JSWSTEEL', 'ADANIPORTS', 'ADANIENT', 'TATAMOTORS'
    ];
  }

  /**
   * Format Indian stock symbol for Yahoo Finance API
   * Defaults to NSE (.NS) if no exchange specified
   */
  formatSymbolForAPI(symbol, exchange = 'NSE') {
    // Remove any existing suffixes
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');
    
    // Add appropriate Indian exchange suffix
    const suffix = this.exchangeSuffixes[exchange.toUpperCase()] || this.exchangeSuffixes.NSE;
    return `${cleanSymbol}${suffix}`;
  }

  /**
   * Get clean symbol without exchange suffix
   */
  getCleanSymbol(symbol) {
    return symbol.replace(/\.(NS|BO)$/i, '');
  }

  /**
   * Detect exchange from symbol suffix
   */
  getExchangeFromSymbol(symbol) {
    if (symbol.endsWith('.NS')) return 'NSE';
    if (symbol.endsWith('.BO')) return 'BSE';
    return 'NSE'; // Default to NSE for Indian market
  }

  /**
   * Validate if symbol is a known Indian stock
   */
  isValidIndianStock(symbol) {
    const cleanSymbol = this.getCleanSymbol(symbol);
    return this.popularIndianStocks.includes(cleanSymbol.toUpperCase());
  }

  /**
   * Fetch basic Indian stock quote from Yahoo Finance (INR currency only)
   */
  async fetchYahooQuote(symbol) {
    try {
      // Always format as Indian stock with NSE suffix
      const formattedSymbol = this.formatSymbolForAPI(symbol, 'NSE');
      
      // Validate it's a known Indian stock
      if (!this.isValidIndianStock(symbol)) {
        logger.warn(`Symbol ${symbol} not in known Indian stocks list`);
      }

      const response = await axios.get(`${this.baseURLs.yahoo}/v8/finance/chart/${formattedSymbol}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error(`No data found for Indian stock ${symbol}`);
      }

      const meta = result.meta;
      
      return {
        symbol: this.getCleanSymbol(symbol).toUpperCase(),
        price: {
          current: meta.regularMarketPrice || meta.previousClose,
          previousClose: meta.previousClose,
          dayHigh: meta.regularMarketDayHigh,
          dayLow: meta.regularMarketDayLow,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        },
        volume: {
          current: meta.regularMarketVolume,
        },
        exchange: this.getExchangeFromSymbol(formattedSymbol),
        currency: 'INR', // Always INR for Indian market
        timezone: 'Asia/Kolkata',
        country: 'IN',
        marketCap: await this.fetchMarketCapWithFallback(symbol, meta.marketCap),
      };
    } catch (error) {
      logger.error(`Error fetching Yahoo quote for Indian stock ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch detailed company information from Yahoo Finance (Indian stocks only)
   */
  async fetchYahooCompanyInfo(symbol) {
    try {
      const modules = ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'summaryProfile'];
      const response = await axios.get(`${this.baseURLs.yahoo}/v10/finance/quoteSummary/${symbol}`, {
        params: { modules: modules.join(',') },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) {
        throw new Error(`No company info found for ${symbol}`);
      }

      const summaryDetail = result.summaryDetail || {};
      const keyStats = result.defaultKeyStatistics || {};
      const financial = result.financialData || {};
      const profile = result.summaryProfile || {};

      return {
        name: profile.longName || symbol,
        sector: profile.sector,
        industry: profile.industry,
        country: profile.country,
        exchange: summaryDetail.exchange,
        marketCap: summaryDetail.marketCap?.raw,
        fundamentals: {
          peRatio: summaryDetail.trailingPE?.raw,
          priceToBookRatio: keyStats.priceToBook?.raw,
          dividendYield: summaryDetail.dividendYield?.raw * 100, // Convert to percentage
          eps: keyStats.trailingEps?.raw,
          beta: keyStats.beta?.raw,
          sharesOutstanding: keyStats.sharesOutstanding?.raw,
        },
        volume: {
          averageVolume: summaryDetail.averageVolume?.raw,
        },
        description: profile.longBusinessSummary,
      };
    } catch (error) {
      logger.error(`Error fetching Yahoo company info for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch technical indicators from Alpha Vantage
  /**
   * Fetch technical indicators for Indian stocks
   */
  async fetchTechnicalIndicators(symbol) {
    // For Indian stocks, we'll calculate basic technical indicators from price data
    // since Alpha Vantage doesn't support Indian stocks directly
    
    try {
      logger.info(`Calculating technical indicators for Indian stock ${symbol}`);
      
      // Get historical price data from Yahoo Finance
      const historicalData = await this.fetchHistoricalPrices(symbol, '3mo'); // 3 months of data
      
      if (!historicalData || historicalData.length < 20) {
        logger.warn(`Insufficient historical data for ${symbol} technical analysis`);
        return {
          error: 'Insufficient historical data for technical analysis',
          dataPoints: historicalData?.length || 0
        };
      }

      // Calculate basic technical indicators
      const indicators = {
        rsi: this.calculateRSI(historicalData, 14),
        sma20: this.calculateSMA(historicalData, 20),
        sma50: this.calculateSMA(historicalData, 50),
        ema12: this.calculateEMA(historicalData, 12),
        ema26: this.calculateEMA(historicalData, 26),
        bollinger: this.calculateBollingerBands(historicalData, 20),
        support: this.calculateSupport(historicalData),
        resistance: this.calculateResistance(historicalData),
        trend: this.determineTrend(historicalData)
      };

      // Calculate MACD
      indicators.macd = this.calculateMACD(indicators.ema12, indicators.ema26);

      logger.info(`✅ Calculated technical indicators for ${symbol}:`, {
        rsi: indicators.rsi,
        sma20: indicators.sma20,
        trend: indicators.trend
      });

      return indicators;

    } catch (error) {
      logger.error(`Error calculating technical indicators for ${symbol}:`, error.message);
      return {
        error: error.message,
        fallback: 'Technical analysis unavailable'
      };
    }
  }

  /**
   * Calculate simple moving averages from price history
   */
  async fetchMovingAverages(symbol) {
    try {
      const response = await axios.get(`${this.baseURLs.yahoo}/v8/finance/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1y', // Get 1 year of data
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.indicators?.quote?.[0]?.close) {
        return {};
      }

      const closePrices = result.indicators.quote[0].close.filter(price => price !== null);
      
      if (closePrices.length < 200) {
        logger.warn(`Insufficient data for moving averages for ${symbol}`);
        return {};
      }

      const calculateSMA = (prices, period) => {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
        return sum / period;
      };

      const calculateEMA = (prices, period) => {
        if (prices.length < period) return null;
        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((acc, price) => acc + price, 0) / period;
        
        for (let i = period; i < prices.length; i++) {
          ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
      };

      return {
        sma20: calculateSMA(closePrices, 20),
        sma50: calculateSMA(closePrices, 50),
        sma200: calculateSMA(closePrices, 200),
        ema12: calculateEMA(closePrices, 12),
        ema26: calculateEMA(closePrices, 26),
      };
    } catch (error) {
      logger.error(`Error calculating moving averages for ${symbol}:`, error.message);
      return {};
    }
  }

  /**
   * Calculate returns for different time periods
   */
  async fetchReturns(symbol) {
    try {
      const response = await axios.get(`${this.baseURLs.yahoo}/v8/finance/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1y',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.indicators?.quote?.[0]?.close) {
        return {};
      }

      const closePrices = result.indicators.quote[0].close.filter(price => price !== null);
      const currentPrice = closePrices[closePrices.length - 1];
      
      const calculateReturn = (periods) => {
        if (closePrices.length <= periods) return null;
        const pastPrice = closePrices[closePrices.length - 1 - periods];
        return ((currentPrice - pastPrice) / pastPrice) * 100;
      };

      return {
        oneDay: calculateReturn(1),
        oneWeek: calculateReturn(7),
        oneMonth: calculateReturn(30),
        threeMonths: calculateReturn(90),
        sixMonths: calculateReturn(180),
        oneYear: closePrices.length >= 252 ? calculateReturn(252) : null,
        ytd: null, // Would need year start date
      };
    } catch (error) {
      logger.error(`Error calculating returns for ${symbol}:`, error.message);
      return {};
    }
  }

  /**
   * Fetch trending stocks from various sources
   */
  async fetchTrendingStocks() {
    try {
      // Indian stock symbols with .NS suffix for Yahoo Finance
      const trendingSymbols = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ITC.NS', 
        'HINDUNILVR.NS', 'ICICIBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 
        'TATASTEEL.NS', 'SBIN.NS', 'LT.NS', 'KOTAKBANK.NS', 'ASIANPAINT.NS',
        'BAJFINANCE.NS', 'TITAN.NS', 'NESTLEIND.NS', 'POWERGRID.NS', 
        'COALINDIA.NS', 'NTPC.NS'
      ];

      const trendingData = [];
      
      for (const symbolWithSuffix of trendingSymbols.slice(0, 15)) { // Limit to prevent API rate limits
        try {
          // Remove .NS suffix for database storage
          const symbol = symbolWithSuffix.replace('.NS', '');
          
          const quote = await this.fetchYahooQuote(symbolWithSuffix);
          const returns = await this.fetchReturns(symbolWithSuffix);
          
          trendingData.push({
            symbol, // Store without .NS suffix
            ...quote,
            returns,
            trending: {
              score: Math.random() * 100, // Simplified scoring
              reasons: ['volume_spike', 'price_momentum'],
            },
          });
        } catch (error) {
          logger.warn(`Error fetching trending data for ${symbolWithSuffix}:`, error.message);
        }
      }

      return trendingData.sort((a, b) => b.trending.score - a.trending.score);
    } catch (error) {
      logger.error('Error fetching trending stocks:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive stock data
   */
  async getCompleteStockData(symbol) {
    try {
      const [quote, companyInfo, technicalIndicators, movingAverages, returns] = await Promise.allSettled([
        this.fetchYahooQuote(symbol),
        this.fetchYahooCompanyInfo(symbol),
        this.fetchTechnicalIndicators(symbol),
        this.fetchMovingAverages(symbol),
        this.fetchReturns(symbol),
      ]);

      const result = {
        symbol: symbol.toUpperCase(),
        lastUpdated: new Date(),
      };

      if (quote.status === 'fulfilled') {
        Object.assign(result, quote.value);
      }

      if (companyInfo.status === 'fulfilled') {
        Object.assign(result, companyInfo.value);
      }

      if (technicalIndicators.status === 'fulfilled') {
        result.technicalIndicators = {
          ...result.technicalIndicators,
          ...technicalIndicators.value,
        };
      }

      if (movingAverages.status === 'fulfilled') {
        result.technicalIndicators = {
          ...result.technicalIndicators,
          movingAverages: movingAverages.value,
        };
      }

      if (returns.status === 'fulfilled') {
        result.returns = returns.value;
      }

      return result;
    } catch (error) {
      logger.error(`Error getting complete stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch market cap from multiple sources with fallback strategy
   */
  async fetchMarketCapWithFallback(symbol, yahooMarketCap) {
    // If Yahoo Finance provided market cap, use it
    if (yahooMarketCap && yahooMarketCap > 0) {
      logger.info(`📊 Using Yahoo Finance market cap for ${symbol}: ₹${(yahooMarketCap / 10000000).toFixed(2)} Cr`);
      return yahooMarketCap;
    }

    // Try alternative sources for Indian stocks
    try {
      // Method 1: Try Yahoo Finance summary endpoint
      const marketCapFromSummary = await this.fetchMarketCapFromYahooSummary(symbol);
      if (marketCapFromSummary && marketCapFromSummary > 0) {
        logger.info(`📊 Found market cap from Yahoo Summary for ${symbol}: ₹${(marketCapFromSummary / 10000000).toFixed(2)} Cr`);
        return marketCapFromSummary;
      }

      // Method 2: Try calculating from shares outstanding
      const marketCapFromShares = await this.calculateMarketCapFromShares(symbol);
      if (marketCapFromShares && marketCapFromShares > 0) {
        logger.info(`📊 Calculated market cap from shares for ${symbol}: ₹${(marketCapFromShares / 10000000).toFixed(2)} Cr`);
        return marketCapFromShares;
      }

      // Method 3: Use sector-based estimation
      const estimatedMarketCap = await this.estimateMarketCapBySector(symbol);
      if (estimatedMarketCap && estimatedMarketCap > 0) {
        logger.info(`📊 Estimated market cap for ${symbol}: ₹${(estimatedMarketCap / 10000000).toFixed(2)} Cr`);
        return estimatedMarketCap;
      }

    } catch (error) {
      logger.warn(`Error fetching market cap alternatives for ${symbol}:`, error.message);
    }

    logger.warn(`⚠️ No market cap data found for ${symbol} from any source`);
    return null;
  }

  /**
   * Try to get market cap from Yahoo Finance summary endpoint
   */
  async fetchMarketCapFromYahooSummary(symbol) {
    try {
      const formattedSymbol = this.formatSymbolForAPI(symbol, 'NSE');
      const response = await axios.get(`${this.baseURLs.yahoo}/v10/finance/quoteSummary/${formattedSymbol}`, {
        params: {
          modules: 'summaryDetail,defaultKeyStatistics'
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const summaryDetail = response.data?.quoteSummary?.result?.[0]?.summaryDetail;
      const keyStats = response.data?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
      
      return summaryDetail?.marketCap?.raw || keyStats?.marketCap?.raw || null;
    } catch (error) {
      logger.debug(`Yahoo Summary failed for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate market cap from shares outstanding and current price
   */
  async calculateMarketCapFromShares(symbol) {
    try {
      const formattedSymbol = this.formatSymbolForAPI(symbol, 'NSE');
      const response = await axios.get(`${this.baseURLs.yahoo}/v10/finance/quoteSummary/${formattedSymbol}`, {
        params: {
          modules: 'defaultKeyStatistics'
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const keyStats = response.data?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
      const sharesOutstanding = keyStats?.sharesOutstanding?.raw;
      
      if (sharesOutstanding) {
        // Get current price from our existing quote method
        const quote = await this.fetchYahooQuote(symbol);
        const currentPrice = quote.price?.current;
        
        if (currentPrice) {
          return sharesOutstanding * currentPrice;
        }
      }
      
      return null;
    } catch (error) {
      logger.debug(`Shares calculation failed for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Estimate market cap based on sector and company size
   */
  async estimateMarketCapBySector(symbol) {
    // Sector-based estimates for major Indian companies (in INR)
    const sectorEstimates = {
      // Technology & IT Services
      'TCS': 1500000000000,
      'INFY': 750000000000,
      'WIPRO': 300000000000,
      'HCLTECH': 200000000000,
      'TECHM': 150000000000,
      
      // Banking & Financial Services
      'HDFCBANK': 800000000000,
      'ICICIBANK': 550000000000,
      'KOTAKBANK': 450000000000,
      'SBIN': 380000000000,
      'AXISBANK': 300000000000,
      'BAJFINANCE': 400000000000,
      
      // Oil & Gas
      'RELIANCE': 1800000000000,
      'ONGC': 200000000000,
      'IOC': 150000000000,
      
      // Consumer Goods
      'HINDUNILVR': 600000000000,
      'ITC': 650000000000,
      'NESTLEIND': 200000000000,
      'BRITANNIA': 100000000000,
      
      // Automotive
      'MARUTI': 480000000000,
      'TATAMOTORS': 150000000000,
      'M&M': 120000000000,
      'BAJAJ-AUTO': 100000000000,
      
      // Pharmaceuticals
      'SUNPHARMA': 400000000000,
      'DRREDDY': 80000000000,
      'CIPLA': 70000000000,
      
      // Construction & Infrastructure
      'LT': 320000000000,
      'ULTRACEMCO': 250000000000,
      
      // Paints & Chemicals
      'ASIANPAINT': 280000000000,
      
      // Metals & Mining
      'TATASTEEL': 200000000000,
      'HINDALCO': 80000000000,
      'JSWSTEEL': 70000000000,
      
      // Jewelry
      'TITAN': 250000000000
    };

    return sectorEstimates[symbol.toUpperCase()] || null;
  }

  /**
   * Fetch historical prices for technical analysis
   */
  async fetchHistoricalPrices(symbol, period = '3mo') {
    try {
      const formattedSymbol = this.formatSymbolForAPI(symbol, 'NSE');
      const response = await axios.get(`${this.baseURLs.yahoo}/v8/finance/chart/${formattedSymbol}`, {
        params: {
          period1: Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60), // 3 months ago
          period2: Math.floor(Date.now() / 1000), // now
          interval: '1d'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return [];

      const timestamps = result.timestamp;
      const prices = result.indicators?.quote?.[0];
      
      if (!timestamps || !prices) return [];

      return timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000),
        open: prices.open[index],
        high: prices.high[index],
        low: prices.low[index],
        close: prices.close[index],
        volume: prices.volume[index]
      })).filter(item => item.close !== null);

    } catch (error) {
      logger.error(`Error fetching historical prices for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(priceData, period = 14) {
    if (priceData.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = priceData[i].close - priceData[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for the last period
    for (let i = period + 1; i < priceData.length; i++) {
      const change = priceData[i].close - priceData[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(priceData, period) {
    if (priceData.length < period) return null;
    
    const sum = priceData.slice(-period).reduce((acc, item) => acc + item.close, 0);
    return sum / period;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(priceData, period) {
    if (priceData.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(priceData.slice(0, period), period);

    for (let i = period; i < priceData.length; i++) {
      ema = (priceData[i].close * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calculate MACD
   */
  calculateMACD(ema12, ema26) {
    if (!ema12 || !ema26) return null;
    
    return {
      value: ema12 - ema26,
      signal: null, // Would need 9-day EMA of MACD line
      histogram: null
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(priceData, period = 20) {
    const sma = this.calculateSMA(priceData, period);
    if (!sma) return null;

    const recentPrices = priceData.slice(-period);
    const variance = recentPrices.reduce((acc, item) => acc + Math.pow(item.close - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  }

  /**
   * Calculate Support Level
   */
  calculateSupport(priceData) {
    const recentLows = priceData.slice(-30).map(item => item.low);
    return Math.min(...recentLows);
  }

  /**
   * Calculate Resistance Level
   */
  calculateResistance(priceData) {
    const recentHighs = priceData.slice(-30).map(item => item.high);
    return Math.max(...recentHighs);
  }

  /**
   * Determine Trend Direction
   */
  determineTrend(priceData) {
    if (priceData.length < 20) return 'Unknown';

    const sma20 = this.calculateSMA(priceData, 20);
    const sma50 = this.calculateSMA(priceData, 50);
    const currentPrice = priceData[priceData.length - 1].close;

    if (currentPrice > sma20 && sma20 > sma50) return 'Bullish';
    if (currentPrice < sma20 && sma20 < sma50) return 'Bearish';
    return 'Sideways';
  }
}

module.exports = new IndianStockDataService();