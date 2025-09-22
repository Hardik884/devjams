const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Stock = require('../src/models/Stock');

async function debugCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
    // Check current stock timestamps
    const stocks = await Stock.find({}, 'symbol lastUpdated').sort({ symbol: 1 });
    
    console.log('\n📅 Current stock timestamps:');
    console.log('Current time:', new Date());
    
    stocks.forEach(stock => {
      const ageMs = new Date() - stock.lastUpdated;
      const ageMinutes = Math.round(ageMs / 1000 / 60);
      console.log(`${stock.symbol}: ${stock.lastUpdated} (${ageMinutes} min ago)`);
    });
    
    // Check cache logic
    const oneMinuteAgo = new Date() - (1 * 60 * 1000);
    console.log('\n⏰ Cache expiry check (1 minute):');
    console.log('One minute ago:', new Date(oneMinuteAgo));
    
    stocks.forEach(stock => {
      const isStale = new Date() - stock.lastUpdated > 1 * 60 * 1000;
      console.log(`${stock.symbol}: ${isStale ? 'STALE (should fetch API)' : 'FRESH (use cache)'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

debugCache();