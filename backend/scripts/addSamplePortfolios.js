const mongoose = require('mongoose');
const User = require('../src/models/User');
const Portfolio = require('../src/models/Portfolio');
const Stock = require('../src/models/Stock');

// Load environment variables
require('dotenv').config();

async function addSamplePortfolioData() {
  try {
    // Connect to database using the same URL as the main app
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/devjams';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    // First, let's make sure we have some stocks in the database
    const sampleStocks = [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy', currentPrice: 2450.75 },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', sector: 'Information Technology', currentPrice: 3890.25 },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Financial Services', currentPrice: 1650.50 },
      { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'Information Technology', currentPrice: 1780.30 },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', sector: 'Consumer Goods', currentPrice: 2340.80 },
      { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'Consumer Goods', currentPrice: 456.75 },
      { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financial Services', currentPrice: 580.25 },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecommunications', currentPrice: 1245.60 },
      { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', sector: 'Consumer Goods', currentPrice: 3120.45 },
      { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', sector: 'Automotive', currentPrice: 10890.30 }
    ];

    // Add or update stocks with correct price structure
    for (const stockData of sampleStocks) {
      const previousClose = stockData.currentPrice * (0.98 + Math.random() * 0.04); // Random previous close ±2%
      
      await Stock.findOneAndUpdate(
        { symbol: stockData.symbol },
        {
          symbol: stockData.symbol,
          name: stockData.name,
          sector: stockData.sector,
          exchange: 'NSE',
          country: 'IN',
          currency: 'INR',
          price: {
            current: stockData.currentPrice,
            previousClose: previousClose,
            dayHigh: stockData.currentPrice * (1 + Math.random() * 0.03),
            dayLow: stockData.currentPrice * (1 - Math.random() * 0.03),
            fiftyTwoWeekHigh: stockData.currentPrice * (1 + Math.random() * 0.3),
            fiftyTwoWeekLow: stockData.currentPrice * (1 - Math.random() * 0.3),
          },
          fundamentals: {
            peRatio: Math.random() * 30 + 10, // Random P/E ratio between 10-40
            dividendYield: Math.random() * 5, // Random dividend yield 0-5%
          },
          marketCap: stockData.currentPrice * 1000000000, // Mock market cap
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log('Added sample stocks');

    // Use the specific user ID from the JWT token
    const userId = '68d08e64dc2a065669055fa9'; // From your JWT token
    
    // Get or create the user
    let user = await User.findById(userId);
    if (!user) {
      user = await User.create({
        _id: userId,
        name: 'Harsh Dalmia',
        email: 'harshdalmia09@gmail.com',
        password: 'password123', // This will be hashed by the User model
      });
      console.log('Created user');
    } else {
      console.log('User found:', user.email);
    }

    // Create sample portfolios
    const samplePortfolios = [
      {
        name: 'Diversified Growth Portfolio',
        description: 'A well-balanced portfolio focused on long-term growth across multiple sectors',
        userId: userId,
        assets: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS'],
        weights: [0.25, 0.20, 0.20, 0.20, 0.15],
        initialBalance: 500000,
        currentBalance: 545000,
        currency: 'INR',
        riskProfile: {
          riskTolerance: 0.7,
          maxDrawdown: 0.25,
          targetReturn: 0.12,
          rebalanceFrequency: 'quarterly'
        }
      },
      {
        name: 'Conservative Income Portfolio',
        description: 'A conservative portfolio focusing on stable returns and dividend income',
        userId: userId,
        assets: ['HDFCBANK.NS', 'SBIN.NS', 'ITC.NS', 'HINDUNILVR.NS'],
        weights: [0.35, 0.25, 0.25, 0.15],
        initialBalance: 300000,
        currentBalance: 318000,
        currency: 'INR',
        riskProfile: {
          riskTolerance: 0.3,
          maxDrawdown: 0.15,
          targetReturn: 0.08,
          rebalanceFrequency: 'monthly'
        }
      },
      {
        name: 'Tech-Focused Portfolio',
        description: 'High-growth portfolio concentrated in technology and telecom sectors',
        userId: userId,
        assets: ['TCS.NS', 'INFY.NS', 'BHARTIARTL.NS'],
        weights: [0.45, 0.35, 0.20],
        initialBalance: 250000,
        currentBalance: 285000,
        currency: 'INR',
        riskProfile: {
          riskTolerance: 0.8,
          maxDrawdown: 0.30,
          targetReturn: 0.15,
          rebalanceFrequency: 'monthly'
        }
      }
    ];

    // Delete existing portfolios for this user to avoid duplicates
    await Portfolio.deleteMany({ userId: userId });

    // Create the portfolios
    for (const portfolioData of samplePortfolios) {
      const portfolio = await Portfolio.create(portfolioData);
      console.log(`Created portfolio: ${portfolio.name} (ID: ${portfolio._id})`);
    }

    console.log('Sample portfolio data added successfully!');
    console.log(`User ID: ${userId}`);
    console.log('You can now test the portfolio analytics feature');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addSamplePortfolioData();