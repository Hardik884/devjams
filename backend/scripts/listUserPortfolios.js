const mongoose = require('mongoose');
const User = require('../src/models/User');
const Portfolio = require('../src/models/Portfolio');

// Load environment variables
require('dotenv').config();

async function listUserPortfolios() {
  try {
    // Connect to database
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/devjams';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    // Your user ID from the JWT token
    const userId = '68d08e64dc2a065669055fa9';
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return;
    }
    
    console.log('User found:', user.name, '-', user.email);

    // Find portfolios for this user
    const portfolios = await Portfolio.find({ userId: userId });
    
    if (portfolios.length === 0) {
      console.log('No portfolios found for this user');
    } else {
      console.log(`\nFound ${portfolios.length} portfolios:`);
      portfolios.forEach((portfolio, index) => {
        console.log(`\n${index + 1}. Portfolio ID: ${portfolio._id}`);
        console.log(`   Name: ${portfolio.name}`);
        console.log(`   Description: ${portfolio.description}`);
        console.log(`   Assets: ${portfolio.assets.join(', ')}`);
        console.log(`   Initial Balance: ₹${portfolio.initialBalance}`);
        console.log(`   Current Balance: ₹${portfolio.currentBalance}`);
        console.log(`   Created: ${portfolio.createdAt}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
listUserPortfolios();