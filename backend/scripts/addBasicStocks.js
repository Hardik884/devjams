const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Stock = require('../src/models/Stock');

// Basic Indian stock data for testing
const basicIndianStocks = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    sector: 'Oil & Gas',
    industry: 'Refineries',
    marketCap: 1800000000000, // 18 lakh crores in INR
    country: 'IN',
    currency: 'INR',
    price: {
      current: 2400,
      previousClose: 2380,
      dayHigh: 2420,
      dayLow: 2375,
      fiftyTwoWeekHigh: 2856,
      fiftyTwoWeekLow: 2220,
    },
    volume: {
      current: 5000000,
      averageVolume: 4500000,
    },
    fundamentals: {
      peRatio: 15.5,
      eps: 154.84,
      dividendYield: 0.33,
      beta: 1.2,
    },
    performance: {
      change: 20,
      changePercent: 0.84,
      marketReturn: 12.5,
      yearToDateReturn: 8.5,
    },
    technicals: {
      rsi: 58.2,
      movingAverages: {
        sma20: 2385,
        sma50: 2410,
        ema20: 2390,
      }
    },
    lastUpdated: new Date(),
    isActive: true,
    tags: ['large-cap', 'oil-gas', 'energy'],
    description: 'India\'s largest private sector company with interests in petrochemicals, oil & gas, telecom and retail.'
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Limited',
    exchange: 'NSE',
    sector: 'Information Technology',
    industry: 'IT Services',
    marketCap: 1500000000000, // 15 lakh crores in INR
    country: 'IN',
    currency: 'INR',
    price: {
      current: 4100,
      previousClose: 4080,
      dayHigh: 4125,
      dayLow: 4075,
      fiftyTwoWeekHigh: 4592,
      fiftyTwoWeekLow: 3311,
    },
    volume: {
      current: 2000000,
      averageVolume: 1800000,
    },
    fundamentals: {
      peRatio: 28.5,
      eps: 143.86,
      dividendYield: 0.59,
      beta: 0.8,
    },
    performance: {
      change: 20,
      changePercent: 0.49,
      marketReturn: 15.2,
      yearToDateReturn: 12.8,
    },
    technicals: {
      rsi: 62.5,
      movingAverages: {
        sma20: 4095,
        sma50: 4120,
        ema20: 4105,
      }
    },
    lastUpdated: new Date(),
    isActive: true,
    tags: ['large-cap', 'it-services', 'technology'],
    description: 'Leading global IT services, consulting and business solutions organization.'
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Private Sector Bank',
    marketCap: 1200000000000, // 12 lakh crores in INR
    country: 'IN',
    currency: 'INR',
    price: {
      current: 1600,
      previousClose: 1590,
      dayHigh: 1615,
      dayLow: 1585,
      fiftyTwoWeekHigh: 1740,
      fiftyTwoWeekLow: 1363,
    },
    volume: {
      current: 3000000,
      averageVolume: 2500000,
    },
    fundamentals: {
      peRatio: 18.2,
      eps: 87.92,
      dividendYield: 1.19,
      beta: 1.1,
    },
    performance: {
      change: 10,
      changePercent: 0.63,
      marketReturn: 18.5,
      yearToDateReturn: 15.2,
    },
    technicals: {
      rsi: 55.8,
      movingAverages: {
        sma20: 1595,
        sma50: 1605,
        ema20: 1598,
      }
    },
    lastUpdated: new Date(),
    isActive: true,
    tags: ['large-cap', 'banking', 'financial-services'],
    description: 'India\'s largest private sector bank by assets and market capitalization.'
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NSE',
    sector: 'Information Technology',
    industry: 'IT Services',
    marketCap: 750000000000, // 7.5 lakh crores in INR
    country: 'IN',
    currency: 'INR',
    price: {
      current: 1800,
      previousClose: 1785,
      dayHigh: 1820,
      dayLow: 1775,
      fiftyTwoWeekHigh: 1887,
      fiftyTwoWeekLow: 1351,
    },
    volume: {
      current: 4000000,
      averageVolume: 3500000,
    },
    fundamentals: {
      peRatio: 25.8,
      eps: 69.77,
      dividendYield: 1.72,
      beta: 0.9,
    },
    performance: {
      change: 15,
      changePercent: 0.84,
      marketReturn: 14.8,
      yearToDateReturn: 11.5,
    },
    technicals: {
      rsi: 60.1,
      movingAverages: {
        sma20: 1795,
        sma50: 1810,
        ema20: 1802,
      }
    },
    lastUpdated: new Date(),
    isActive: true,
    tags: ['large-cap', 'it-services', 'technology'],
    description: 'Global leader in next-generation digital services and consulting.'
  },
  {
    symbol: 'ITC',
    name: 'ITC Limited',
    exchange: 'NSE',
    sector: 'Consumer Goods',
    industry: 'Diversified FMCG',
    marketCap: 650000000000, // 6.5 lakh crores in INR
    country: 'IN',
    currency: 'INR',
    price: {
      current: 525,
      previousClose: 520,
      dayHigh: 530,
      dayLow: 518,
      fiftyTwoWeekHigh: 543,
      fiftyTwoWeekLow: 385,
    },
    volume: {
      current: 8000000,
      averageVolume: 7000000,
    },
    fundamentals: {
      peRatio: 22.5,
      eps: 23.33,
      dividendYield: 2.14,
      beta: 0.7,
    },
    performance: {
      change: 5,
      changePercent: 0.96,
      marketReturn: 8.5,
      yearToDateReturn: 6.8,
    },
    technicals: {
      rsi: 48.5,
      movingAverages: {
        sma20: 522,
        sma50: 518,
        ema20: 523,
      }
    },
    lastUpdated: new Date(),
    isActive: true,
    tags: ['large-cap', 'fmcg', 'consumer-goods'],
    description: 'Leading diversified conglomerate with presence in FMCG, Hotels, Packaging, Agri-Business and Information Technology.'
  }
];

async function addBasicStocks() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Clear existing stocks
    await Stock.deleteMany({});
    console.log('🗑️ Cleared existing stocks');

    // Add basic stocks
    console.log('📊 Adding basic Indian stocks...');
    
    for (const stockData of basicIndianStocks) {
      try {
        const stock = new Stock(stockData);
        await stock.save();
        console.log(`✅ Added ${stockData.symbol} - ${stockData.name}`);
      } catch (error) {
        console.error(`❌ Error adding ${stockData.symbol}:`, error.message);
      }
    }

    console.log('\n🎉 Successfully added basic Indian stocks to database!');
    console.log(`📊 Total stocks: ${basicIndianStocks.length}`);

    // Verify the stocks were added
    const stockCount = await Stock.countDocuments();
    console.log(`✅ Verification: ${stockCount} stocks in database`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

addBasicStocks();