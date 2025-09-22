// Test script to check if JWT_SECRET_KEY is loaded
console.log('🔍 Checking Environment Variables');
require('dotenv').config();

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET_KEY exists:', !!process.env.JWT_SECRET_KEY);
console.log('JWT_SECRET_KEY length:', process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY.length : 0);
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);

if (!process.env.JWT_SECRET_KEY) {
  console.error('❌ JWT_SECRET_KEY is not set!');
} else {
  console.log('✅ JWT_SECRET_KEY is properly loaded');
}