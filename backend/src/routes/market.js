const express = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Some routes may be public, others protected
router.use(optionalAuth);

// Placeholder for market data endpoints
router.get('/assets', (req, res) => {
  res.json({ success: true, message: 'Available assets - coming soon' });
});

router.get('/data/:symbol', (req, res) => {
  res.json({ success: true, message: 'Market data - coming soon' });
});

module.exports = router;