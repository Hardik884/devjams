const stockDataService = require('../src/services/stockDataService');
const logger = require('../src/utils/logger');

// Test Indian market functionality
async function testIndianMarketSupport() {
  console.log('🇮🇳 Testing Indian Market Support...\n');

  const service = new stockDataService();

  // Test market detection
  console.log('1. Testing Market Detection:');
  console.log(`RELIANCE is Indian stock: ${service.isIndianStock('RELIANCE')}`);
  console.log(`AAPL is Indian stock: ${service.isIndianStock('AAPL')}`);
  console.log(`TCS is Indian stock: ${service.isIndianStock('TCS')}`);

  // Test symbol formatting
  console.log('\n2. Testing Symbol Formatting:');
  console.log(`RELIANCE formatted: ${service.formatIndianSymbol('RELIANCE')}`);
  console.log(`TCS formatted: ${service.formatIndianSymbol('TCS')}`);
  console.log(`HDFCBANK formatted: ${service.formatIndianSymbol('HDFCBANK')}`);

  // Test market info
  console.log('\n3. Testing Market Info:');
  const relianceMarket = service.getMarketInfo('RELIANCE');
  console.log('RELIANCE market info:', JSON.stringify(relianceMarket, null, 2));

  const appleMarket = service.getMarketInfo('AAPL');
  console.log('AAPL market info:', JSON.stringify(appleMarket, null, 2));

  // Test exchange detection
  console.log('\n4. Testing Exchange Detection:');
  console.log(`RELIANCE.NS exchange: ${service.getExchangeFromSymbol('RELIANCE.NS')}`);
  console.log(`TCS.BO exchange: ${service.getExchangeFromSymbol('TCS.BO')}`);
  console.log(`AAPL exchange: ${service.getExchangeFromSymbol('AAPL')}`);

  console.log('\n✅ Indian Market Support Tests Completed!');
  
  // Optional: Test live data fetching (uncomment to test with real API)
  /*
  try {
    console.log('\n5. Testing Live Data Fetching:');
    const relianceData = await service.fetchYahooQuote('RELIANCE');
    console.log('RELIANCE live data:', JSON.stringify(relianceData, null, 2));
  } catch (error) {
    console.log('Error fetching live data:', error.message);
  }
  */
}

// Run the test
testIndianMarketSupport().catch(console.error);