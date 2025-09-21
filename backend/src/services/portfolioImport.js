const XLSX = require('xlsx');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Parse Excel file and extract portfolio data
 * Expected columns: Stock Symbol, Quantity, Purchase Price, Purchase Date
 */
const parseExcelFile = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      throw new Error('Excel file is empty or no data found');
    }
    
    // Normalize column names and extract data
    const portfolioData = jsonData.map((row, index) => {
      // Try to find columns by various possible names
      const symbol = findColumnValue(row, ['Stock Symbol', 'Symbol', 'Ticker', 'Stock', 'Asset']);
      const quantity = findColumnValue(row, ['Quantity', 'Shares', 'Units', 'Amount']);
      const purchasePrice = findColumnValue(row, ['Purchase Price', 'Buy Price', 'Cost Price', 'Price']);
      const purchaseDate = findColumnValue(row, ['Purchase Date', 'Buy Date', 'Date', 'Purchase']);
      
      // Validate required fields
      if (!symbol || !quantity || !purchasePrice) {
        throw new Error(`Row ${index + 2}: Missing required fields (Symbol, Quantity, Purchase Price)`);
      }
      
      // Parse and validate values
      const parsedQuantity = parseFloat(quantity);
      const parsedPrice = parseFloat(purchasePrice);
      
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error(`Row ${index + 2}: Invalid quantity "${quantity}"`);
      }
      
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error(`Row ${index + 2}: Invalid purchase price "${purchasePrice}"`);
      }
      
      // Parse date (optional)
      let parsedDate = null;
      if (purchaseDate) {
        parsedDate = new Date(purchaseDate);
        if (isNaN(parsedDate.getTime())) {
          // Try Excel date parsing
          if (typeof purchaseDate === 'number') {
            parsedDate = XLSX.SSF.parse_date_code(purchaseDate);
            parsedDate = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
          } else {
            parsedDate = null; // Invalid date, set to null
          }
        }
      }
      
      return {
        symbol: symbol.toString().toUpperCase().trim(),
        quantity: parsedQuantity,
        purchasePrice: parsedPrice,
        purchaseDate: parsedDate,
        originalRow: index + 2
      };
    });
    
    return portfolioData;
  } catch (error) {
    logger.error('Excel parsing error:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Helper function to find column value by possible names
 */
const findColumnValue = (row, possibleNames) => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return null;
};

/**
 * Fetch current stock prices from Yahoo Finance API
 */
const fetchCurrentPrices = async (symbols) => {
  try {
    const uniqueSymbols = [...new Set(symbols)]; // Remove duplicates
    const prices = {};
    
    // Yahoo Finance API alternative - you can replace with your preferred API
    for (const symbol of uniqueSymbols) {
      try {
        // Using Yahoo Finance API (free)
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
          timeout: 5000
        });
        
        if (response.data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
          prices[symbol] = response.data.chart.result[0].meta.regularMarketPrice;
        } else {
          logger.warn(`Could not fetch price for ${symbol}`);
          prices[symbol] = null;
        }
      } catch (error) {
        logger.warn(`Error fetching price for ${symbol}:`, error.message);
        prices[symbol] = null;
      }
    }
    
    return prices;
  } catch (error) {
    logger.error('Error fetching current prices:', error);
    throw new Error('Failed to fetch current market prices');
  }
};

/**
 * Alternative: Fetch prices from Alpha Vantage (requires API key)
 */
const fetchCurrentPricesAlphaVantage = async (symbols) => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }
  
  try {
    const prices = {};
    
    for (const symbol of symbols) {
      try {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: apiKey
          },
          timeout: 5000
        });
        
        const quote = response.data['Global Quote'];
        if (quote && quote['05. price']) {
          prices[symbol] = parseFloat(quote['05. price']);
        } else {
          prices[symbol] = null;
        }
      } catch (error) {
        logger.warn(`Error fetching price for ${symbol}:`, error.message);
        prices[symbol] = null;
      }
    }
    
    return prices;
  } catch (error) {
    logger.error('Error fetching prices from Alpha Vantage:', error);
    throw error;
  }
};

/**
 * Calculate portfolio metrics from parsed data and current prices
 */
const calculatePortfolioMetrics = (portfolioData, currentPrices) => {
  let totalPurchaseValue = 0;
  let totalCurrentValue = 0;
  const assets = [];
  const weights = [];
  
  const holdingsMap = new Map();
  
  // Aggregate holdings by symbol
  portfolioData.forEach(holding => {
    const { symbol, quantity, purchasePrice } = holding;
    
    if (holdingsMap.has(symbol)) {
      const existing = holdingsMap.get(symbol);
      existing.quantity += quantity;
      existing.totalCost += quantity * purchasePrice;
      existing.avgPurchasePrice = existing.totalCost / existing.quantity;
    } else {
      holdingsMap.set(symbol, {
        symbol,
        quantity,
        totalCost: quantity * purchasePrice,
        avgPurchasePrice: purchasePrice,
        currentPrice: currentPrices[symbol] || purchasePrice
      });
    }
  });
  
  // Calculate totals and prepare arrays
  holdingsMap.forEach(holding => {
    const purchaseValue = holding.totalCost;
    const currentValue = holding.quantity * holding.currentPrice;
    
    totalPurchaseValue += purchaseValue;
    totalCurrentValue += currentValue;
    
    assets.push(holding.symbol);
  });
  
  // Calculate weights based on current values
  holdingsMap.forEach(holding => {
    const currentValue = holding.quantity * holding.currentPrice;
    const weight = currentValue / totalCurrentValue;
    weights.push(weight);
  });
  
  return {
    assets,
    weights,
    initialBalance: totalPurchaseValue,
    currentBalance: totalCurrentValue,
    holdings: Array.from(holdingsMap.values()),
    totalReturn: totalCurrentValue - totalPurchaseValue,
    totalReturnPct: totalPurchaseValue > 0 ? (totalCurrentValue - totalPurchaseValue) / totalPurchaseValue : 0
  };
};

module.exports = {
  parseExcelFile,
  fetchCurrentPrices,
  fetchCurrentPricesAlphaVantage,
  calculatePortfolioMetrics
};