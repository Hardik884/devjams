const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB connection using Mongoose
const connectDatabase = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/portfolio_rebalancer';
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('✅ Connected to MongoDB successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      logger.info('✅ MongoDB connection test successful');
    } else {
      throw new Error('MongoDB not connected');
    }
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    throw error;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
  } catch (error) {
    logger.error('❌ Error closing MongoDB connection:', error);
  }
};

module.exports = {
  connectDatabase,
  testConnection,
  closeConnection,
};