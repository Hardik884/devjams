const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder for ML rebalancing endpoints
router.post('/predict', (req, res) => {
  res.json({ success: true, message: 'ML prediction endpoint - coming soon' });
});

router.post('/backtest', (req, res) => {
  res.json({ success: true, message: 'Backtesting endpoint - coming soon' });
});

module.exports = router;