const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder for analytics endpoints
router.get('/portfolio/:id/performance', (req, res) => {
  res.json({ success: true, message: 'Performance analytics - coming soon' });
});

router.get('/portfolio/:id/risk', (req, res) => {
  res.json({ success: true, message: 'Risk analytics - coming soon' });
});

module.exports = router;