const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const stockDataService = require('../src/services/stockDataService');
const logger = require('../src/utils/logger');

async function testYahooAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
    console.log('\n🧪 Testing Yahoo Finance API for Indian stocks...\n');
    
    // Test individual stock fetch
    console.log('1. Testing getCompleteStockData for RELIANCE:');
    try {
      const relianceData = await stockDataService.getCompleteStockData('RELIANCE');
      console.log('✅ RELIANCE data:', {
        symbol: relianceData.symbol,
        price: relianceData.price?.current,
        marketCap: relianceData.marketCap,
        name: relianceData.name
      });
    } catch (error) {
      console.log('❌ RELIANCE error:', error.message);
    }
    
    console.log('\n2. Testing fetchTrendingStocks:');
    try {
      const trendingData = await stockDataService.fetchTrendingStocks();
      console.log(`✅ Fetched ${trendingData.length} trending stocks`);
      console.log('First 3 stocks:', trendingData.slice(0, 3).map(s => ({
        symbol: s.symbol,
        price: s.price?.current,
        marketCap: s.marketCap
      })));
    } catch (error) {
      console.log('❌ Trending stocks error:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testYahooAPI();