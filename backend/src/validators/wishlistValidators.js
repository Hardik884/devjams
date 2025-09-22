const { body, param } = require('express-validator');

// Wishlist validation rules
const addStockValidation = [
  body('symbol').notEmpty().withMessage('Stock symbol is required').isString(),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive'),
  body('alertPrice').optional().isFloat({ min: 0 }).withMessage('Alert price must be positive'),
];

const removeStockValidation = [
  param('symbol').notEmpty().withMessage('Stock symbol is required'),
];

const updateStockValidation = [
  param('symbol').notEmpty().withMessage('Stock symbol is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive'),
  body('alertPrice').optional().isFloat({ min: 0 }).withMessage('Alert price must be positive'),
];

const updateWishlistValidation = [
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

module.exports = {
  addStockValidation,
  removeStockValidation,
  updateStockValidation,
  updateWishlistValidation,
};