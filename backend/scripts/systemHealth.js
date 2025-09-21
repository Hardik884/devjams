const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Stock = require('../src/models/Stock');

async function comprehensiveTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');
    
    // 1. Check current data freshness
    console.log('🕐 CHECKING DATA FRESHNESS:');
    const stocks = await Stock.find({}, 'symbol lastUpdated marketCap').sort({ lastUpdated: -1 });
    const now = new Date();
    
    stocks.forEach(stock => {
      const ageMs = now - stock.lastUpdated;
      const ageMinutes = Math.round(ageMs / 1000 / 60);
      const freshness = ageMinutes < 2 ? '🟢 FRESH' : ageMinutes < 15 ? '🟡 RECENT' : '🔴 STALE';
      console.log(`${stock.symbol}: ${freshness} (${ageMinutes}min ago) - MarketCap: ${stock.marketCap ? '✅' : '❌'}`);
    });
    
    // 2. Test cache logic
    console.log('\n⏰ CACHE LOGIC TEST:');
    const trendingStocks = await Stock.find({ isActive: true })
      .sort({ 'trending.score': -1 })
      .limit(10)
      .select('symbol lastUpdated');
    
    const cacheExpiry = 1 * 60 * 1000; // 1 minute
    const isStale = trendingStocks.length === 0 || 
        (trendingStocks[0] && new Date() - trendingStocks[0].lastUpdated > cacheExpiry);
    
    console.log(`Cache should be: ${isStale ? '🔄 STALE (will fetch API)' : '📋 FRESH (use cache)'}`);
    console.log(`Next API call in: ${isStale ? '0 minutes' : Math.ceil((cacheExpiry - (now - trendingStocks[0].lastUpdated)) / 1000 / 60)} minutes`);
    
    // 3. Count market cap coverage
    console.log('\n💰 MARKET CAP COVERAGE:');
    const totalStocks = await Stock.countDocuments({ isActive: true });
    const stocksWithMarketCap = await Stock.countDocuments({ isActive: true, marketCap: { $ne: null } });
    const coverage = Math.round((stocksWithMarketCap / totalStocks) * 100);
    
    console.log(`Total stocks: ${totalStocks}`);
    console.log(`With market cap: ${stocksWithMarketCap}`);
    console.log(`Coverage: ${coverage}% ${coverage > 80 ? '✅' : coverage > 50 ? '⚠️' : '❌'}`);
    
    // 4. Check for any obvious issues
    console.log('\n🔍 ISSUE DETECTION:');
    const stocksWithoutPrice = await Stock.countDocuments({ 
      isActive: true, 
      $or: [
        { 'price.current': null },
        { 'price.current': { $exists: false } }
      ]
    });
    
    const veryOldStocks = await Stock.countDocuments({
      isActive: true,
      lastUpdated: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    });
    
    console.log(`Stocks without price: ${stocksWithoutPrice} ${stocksWithoutPrice === 0 ? '✅' : '❌'}`);
    console.log(`Very old data (>24h): ${veryOldStocks} ${veryOldStocks === 0 ? '✅' : '⚠️'}`);
    
    // 5. Summary
    console.log('\n📊 SYSTEM STATUS SUMMARY:');
    const allGood = stocksWithoutPrice === 0 && coverage > 70 && veryOldStocks === 0;
    console.log(`Overall Status: ${allGood ? '🟢 HEALTHY' : '🟡 NEEDS ATTENTION'}`);
    
    if (!allGood) {
      console.log('\n🔧 RECOMMENDATIONS:');
      if (coverage < 70) console.log('- Run market cap fix script for missing data');
      if (stocksWithoutPrice > 0) console.log('- Check Yahoo Finance API connectivity');
      if (veryOldStocks > 0) console.log('- Clear cache to force fresh data fetch');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

comprehensiveTest();