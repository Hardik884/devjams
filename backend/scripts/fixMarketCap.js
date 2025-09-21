const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load from parent directory

const Stock = require('../src/models/Stock');
const stockDataService = require('../src/services/stockDataService');
const logger = require('../src/utils/logger');

/**
 * Script to update missing market cap data for stocks
 */
async function updateMarketCapData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    logger.info('Connected to MongoDB');

    // Find all stocks with null market cap
    const stocksWithoutMarketCap = await Stock.find({
      $or: [
        { marketCap: null },
        { marketCap: { $exists: false } }
      ]
    });

    logger.info(`Found ${stocksWithoutMarketCap.length} stocks without market cap data`);

    // Update each stock
    let updated = 0;
    let failed = 0;

    for (const stock of stocksWithoutMarketCap) {
      try {
        logger.info(`Updating market cap for ${stock.symbol}...`);
        
        // Fetch fresh data from external API
        const freshData = await stockDataService.getCompleteStockData(stock.symbol);
        
        if (freshData && freshData.marketCap !== null && freshData.marketCap !== undefined) {
          // Update the stock with new market cap data
          await Stock.findByIdAndUpdate(stock._id, {
            marketCap: freshData.marketCap,
            lastUpdated: new Date()
          });
          
          logger.info(`✅ Updated ${stock.symbol}: Market Cap = ₹${(freshData.marketCap / 10000000).toFixed(2)} Cr`);
          updated++;
        } else {
          logger.warn(`⚠️ No market cap data available for ${stock.symbol}`);
          failed++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`❌ Failed to update ${stock.symbol}:`, error.message);
        failed++;
      }
    }

    logger.info(`Update completed: ${updated} successful, ${failed} failed`);

    // Show current status
    const totalStocks = await Stock.countDocuments();
    const stocksWithMarketCap = await Stock.countDocuments({ 
      marketCap: { $ne: null, $exists: true } 
    });

    logger.info(`Final status: ${stocksWithMarketCap}/${totalStocks} stocks have market cap data`);

  } catch (error) {
    logger.error('Error updating market cap data:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

/**
 * Alternative: Add default market cap for major Indian companies
 */
async function addDefaultMarketCaps() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    logger.info('Connected to MongoDB for adding default market caps');

    // Default market caps for major Indian companies (in INR)
    const defaultMarketCaps = {
      'RELIANCE': 1800000000000,     // ₹18 Lakh Cr
      'TCS': 1500000000000,          // ₹15 Lakh Cr
      'HDFCBANK': 800000000000,      // ₹8 Lakh Cr
      'INFY': 750000000000,          // ₹7.5 Lakh Cr
      'ITC': 650000000000,           // ₹6.5 Lakh Cr
      'HINDUNILVR': 600000000000,    // ₹6 Lakh Cr
      'ICICIBANK': 550000000000,     // ₹5.5 Lakh Cr
      'BHARTIARTL': 500000000000,    // ₹5 Lakh Cr
      'KOTAKBANK': 450000000000,     // ₹4.5 Lakh Cr
      'LT': 400000000000,            // ₹4 Lakh Cr
      'SBIN': 380000000000,          // ₹3.8 Lakh Cr
      'ASIANPAINT': 350000000000,    // ₹3.5 Lakh Cr
      'MARUTI': 480000000000,        // ₹4.8 Lakh Cr
      'SUNPHARMA': 400000000000,     // ₹4 Lakh Cr
      'TATASTEEL': 200000000000,     // ₹2 Lakh Cr
      'AXISBANK': 300000000000,      // ₹3 Lakh Cr
      'BAJFINANCE': 400000000000,    // ₹4 Lakh Cr
      'WIPRO': 300000000000,         // ₹3 Lakh Cr
      'ULTRACEMCO': 250000000000,    // ₹2.5 Lakh Cr
      'NESTLEIND': 200000000000,     // ₹2 Lakh Cr
      'TITAN': 250000000000,         // ₹2.5 Lakh Cr
      'POWERGRID': 200000000000,     // ₹2 Lakh Cr
      'NTPC': 150000000000,          // ₹1.5 Lakh Cr
    };

    let updated = 0;

    for (const [symbol, marketCap] of Object.entries(defaultMarketCaps)) {
      try {
        const result = await Stock.findOneAndUpdate(
          { 
            symbol: symbol,
            $or: [
              { marketCap: null },
              { marketCap: { $exists: false } }
            ]
          },
          { 
            marketCap: marketCap,
            lastUpdated: new Date()
          },
          { new: true }
        );

        if (result) {
          logger.info(`✅ Set default market cap for ${symbol}: ₹${(marketCap / 10000000).toFixed(2)} Cr`);
          updated++;
        }
      } catch (error) {
        logger.error(`❌ Failed to update ${symbol}:`, error.message);
      }
    }

    logger.info(`Added default market caps for ${updated} stocks`);

  } catch (error) {
    logger.error('Error adding default market caps:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'update':
    updateMarketCapData();
    break;
  case 'defaults':
    addDefaultMarketCaps();
    break;
  case 'both':
    (async () => {
      await addDefaultMarketCaps();
      await updateMarketCapData();
    })();
    break;
  default:
    console.log(`
Usage: node scripts/fixMarketCap.js [command]

Commands:
  update   - Fetch fresh market cap data from external APIs
  defaults - Add default market cap values for major stocks
  both     - Add defaults first, then update with fresh data

Examples:
  node scripts/fixMarketCap.js defaults
  node scripts/fixMarketCap.js update
  node scripts/fixMarketCap.js both
    `);
    process.exit(1);
}

module.exports = {
  updateMarketCapData,
  addDefaultMarketCaps
};