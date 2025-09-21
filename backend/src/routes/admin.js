const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Placeholder for admin endpoints
router.get('/users', (req, res) => {
  res.json({ success: true, message: 'Admin users endpoint - coming soon' });
});

router.post('/models/retrain', (req, res) => {
  res.json({ success: true, message: 'Model retraining - coming soon' });
});

module.exports = router;