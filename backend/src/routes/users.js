const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Placeholder routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Users endpoint - coming soon' });
});

module.exports = router;