const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.development' });

const Stock = require('../src/models/Stock');
const stockDataService = require('../src/services/stockDataService');
const logger = require('../src/utils/logger');

// Indian stock symbols to populate (NSE/BSE only)
const indianStocks = [
  // Banking & Financial Services
  'HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK',
  'BAJFINANCE', 'BAJAJFINSV', 'PNB', 'BANKBARODA', 'CANBK',
  
  // Information Technology
  'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'MINDTREE',
  
  // Oil & Gas / Energy
  'RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HPCL', 'GAIL', 'OIL',
  
  // Consumer Goods
  'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'GODREJCP',
  'MARICO', 'EMAMILTD', 'VBL',
  
  // Automotive
  'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROIC',
  'ASHOKLEY', 'TVSMOTORS',
  
  // Pharmaceuticals
  'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'BIOCON', 'LUPIN',
  'CADILAHC', 'AUROPHARMA', 'TORNTPHARM',
  
  // Metals & Mining
  'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'NMDC', 'SAIL',
  'COALINDIA', 'NATIONALUM', 'MOIL',
  
  // Infrastructure & Construction
  'LT', 'ULTRACEMCO', 'GRASIM', 'RAMCOCEM', 'SHREECEM', 'ACC',
  'AMBUJACEMENT', 'BHARTIARTL',
  
  // Power & Utilities
  'NTPC', 'POWERGRID', 'TATAPOWER', 'ADANIPOWER', 'NHPC', 'SJVN',
  
  // Textiles
  'RAYMOND', 'VARDHMAN', 'WELCORP', 'ARVIND',
  
  // Paints & Chemicals
  'ASIANPAINT', 'BERGERPAINTS', 'KANSAINER', 'AKZONOBEL',
  
  // Retail & Consumer
  'TITAN', 'TRENT', 'DMART', 'JUBLFOOD', 'WESTLIFE',
  
  // Telecom
  'BHARTIARTL', 'IDEA',
  
  // Conglomerates
  'ADANIENT', 'ADANIPORTS', 'GODREJIND'
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function populateStockData() {
  try {
    logger.info('Starting Indian stock data population...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < indianStocks.length; i++) {
      const symbol = indianStocks[i];
      
      try {
        logger.info(`Fetching data for ${symbol} (${i + 1}/${indianStocks.length})`);
        
        // Check if stock already exists
        const existingStock = await Stock.findOne({ symbol });
        if (existingStock) {
          logger.info(`${symbol} already exists, skipping...`);
          continue;
        }
        
        // Fetch complete stock data
        const stockData = await stockDataService.getCompleteStockData(symbol);
        
        // Create new stock document with Indian market defaults
        const stock = new Stock({
          ...stockData,
          symbol: symbol.toUpperCase(),
          country: 'IN',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          exchange: stockData.exchange || 'NSE',
          isActive: true,
          lastUpdated: new Date(),
        });
        
        // Calculate trending score
        stock.calculateTrendingScore();
        
        // Save to database
        await stock.save();
        
        successCount++;
        logger.info(`✅ Successfully saved ${symbol}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        logger.error(`❌ Error processing ${symbol}:`, error.message);
        
        // Continue with next stock even if one fails
        continue;
      }
    }
    
    logger.info(`\n🎉 Stock data population completed!`);
    logger.info(`✅ Successfully processed: ${successCount} stocks`);
    logger.info(`❌ Errors: ${errorCount} stocks`);
    
    // Update trending ranks
    await updateTrendingRanks();
    
  } catch (error) {
    logger.error('Error in populateStockData:', error);
  }
}

async function updateTrendingRanks() {
  try {
    logger.info('Updating trending ranks...');
    
    const stocks = await Stock.find({ isActive: true })
      .sort({ 'trending.score': -1 })
      .select('symbol trending.score');
    
    for (let i = 0; i < stocks.length; i++) {
      stocks[i].trending.rank = i + 1;
      await stocks[i].save();
    }
    
    logger.info(`✅ Updated trending ranks for ${stocks.length} stocks`);
  } catch (error) {
    logger.error('Error updating trending ranks:', error);
  }
}

async function clearStockData() {
  try {
    logger.info('Clearing existing stock data...');
    const result = await Stock.deleteMany({});
    logger.info(`Deleted ${result.deletedCount} stock records`);
  } catch (error) {
    logger.error('Error clearing stock data:', error);
  }
}

async function main() {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'populate':
      await populateStockData();
      break;
      
    case 'clear':
      await clearStockData();
      break;
      
    case 'refresh':
      await clearStockData();
      await populateStockData();
      break;
      
    case 'update-trending':
      await updateTrendingRanks();
      break;
      
    default:
      logger.info('Usage: node scripts/populateStocks.js [populate|clear|refresh|update-trending]');
      logger.info('  populate: Add stock data to database');
      logger.info('  clear: Remove all stock data');
      logger.info('  refresh: Clear and repopulate stock data');
      logger.info('  update-trending: Update trending scores and ranks');
  }
  
  await mongoose.connection.close();
  logger.info('Database connection closed');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  populateStockData,
  clearStockData,
  updateTrendingRanks,
};