const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Stock = require('../src/models/Stock');

async function clearCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
    // Set all stocks lastUpdated to an old date to force fresh API calls
    const result = await Stock.updateMany(
      {}, 
      { lastUpdated: new Date('2025-01-01') }
    );
    
    console.log(`✅ Cache cleared - ${result.modifiedCount} stocks updated to old date`);
    console.log('Next API call will fetch fresh data from Yahoo Finance');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();