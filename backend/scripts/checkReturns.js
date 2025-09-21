const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Stock = require('../src/models/Stock');

async function checkReturnsData() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');
    
    // Check how many stocks have returns data
    console.log('📊 RETURNS DATA ANALYSIS:');
    
    const totalStocks = await Stock.countDocuments({ isActive: true });
    const stocksWithOneDay = await Stock.countDocuments({ 
      isActive: true, 
      'returns.oneDay': { $exists: true, $ne: null } 
    });
    const stocksWithOneWeek = await Stock.countDocuments({ 
      isActive: true, 
      'returns.oneWeek': { $exists: true, $ne: null } 
    });
    const stocksWithOneMonth = await Stock.countDocuments({ 
      isActive: true, 
      'returns.oneMonth': { $exists: true, $ne: null } 
    });
    
    console.log(`Total active stocks: ${totalStocks}`);
    console.log(`Stocks with oneDay returns: ${stocksWithOneDay} (${Math.round(stocksWithOneDay/totalStocks*100)}%)`);
    console.log(`Stocks with oneWeek returns: ${stocksWithOneWeek} (${Math.round(stocksWithOneWeek/totalStocks*100)}%)`);
    console.log(`Stocks with oneMonth returns: ${stocksWithOneMonth} (${Math.round(stocksWithOneMonth/totalStocks*100)}%)`);
    
    // Show sample data
    console.log('\n🔍 SAMPLE STOCKS WITH RETURNS:');
    const samplesWithReturns = await Stock.find({ 
      isActive: true, 
      'returns.oneDay': { $exists: true, $ne: null } 
    })
    .limit(5)
    .select('symbol price.current returns');
    
    samplesWithReturns.forEach(stock => {
      console.log(`${stock.symbol}: ${stock.returns.oneDay ? (stock.returns.oneDay * 100).toFixed(2) + '%' : 'N/A'}`);
    });
    
    // Show stocks without returns
    console.log('\n❌ STOCKS WITHOUT RETURNS:');
    const samplesWithoutReturns = await Stock.find({ 
      isActive: true, 
      $or: [
        { 'returns.oneDay': { $exists: false } },
        { 'returns.oneDay': null }
      ]
    })
    .limit(5)
    .select('symbol price.current returns');
    
    samplesWithoutReturns.forEach(stock => {
      console.log(`${stock.symbol}: No return data`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkReturnsData();