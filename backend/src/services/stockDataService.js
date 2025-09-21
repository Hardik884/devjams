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
        marketCap: meta.marketCap || null,
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
   */
  async fetchTechnicalIndicators(symbol) {
    if (!this.apiKeys.alphavantage) {
      logger.warn('Alpha Vantage API key not configured');
      return {};
    }

    try {
      const indicators = {};

      // Fetch RSI
      try {
        const rsiResponse = await axios.get(this.baseURLs.alphavantage, {
          params: {
            function: 'RSI',
            symbol,
            interval: 'daily',
            time_period: 14,
            series_type: 'close',
            apikey: this.apiKeys.alphavantage,
          },
          timeout: 5000,
        });

        const rsiData = rsiResponse.data['Technical Analysis: RSI'];
        if (rsiData) {
          const latestDate = Object.keys(rsiData)[0];
          indicators.rsi = parseFloat(rsiData[latestDate]['RSI']);
        }
      } catch (error) {
        logger.warn(`Error fetching RSI for ${symbol}:`, error.message);
      }

      // Fetch MACD
      try {
        const macdResponse = await axios.get(this.baseURLs.alphavantage, {
          params: {
            function: 'MACD',
            symbol,
            interval: 'daily',
            series_type: 'close',
            apikey: this.apiKeys.alphavantage,
          },
          timeout: 5000,
        });

        const macdData = macdResponse.data['Technical Analysis: MACD'];
        if (macdData) {
          const latestDate = Object.keys(macdData)[0];
          const latest = macdData[latestDate];
          indicators.macd = {
            value: parseFloat(latest['MACD']),
            signal: parseFloat(latest['MACD_Signal']),
            histogram: parseFloat(latest['MACD_Hist']),
          };
        }
      } catch (error) {
        logger.warn(`Error fetching MACD for ${symbol}:`, error.message);
      }

      return indicators;
    } catch (error) {
      logger.error(`Error fetching technical indicators for ${symbol}:`, error.message);
      return {};
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
      // This is a simplified implementation
      // In a real application, you'd fetch from multiple sources and aggregate
      const trendingSymbols = [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
        'BRK-B', 'JNJ', 'JPM', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL',
        'ADBE', 'CMCSA', 'CRM', 'INTC', 'PFE', 'VZ', 'KO', 'NKE', 'MRK', 'T',
        'WMT', 'BAC', 'CSCO', 'XOM', 'ABT', 'CVX', 'PEP', 'TMO', 'ACN', 'COST'
      ];

      const trendingData = [];
      
      for (const symbol of trendingSymbols.slice(0, 20)) { // Limit to prevent API rate limits
        try {
          const quote = await this.fetchYahooQuote(symbol);
          const returns = await this.fetchReturns(symbol);
          
          trendingData.push({
            symbol,
            ...quote,
            returns,
            trending: {
              score: Math.random() * 100, // Simplified scoring
              reasons: ['volume_spike', 'price_momentum'],
            },
          });
        } catch (error) {
          logger.warn(`Error fetching trending data for ${symbol}:`, error.message);
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
}

module.exports = new IndianStockDataService();