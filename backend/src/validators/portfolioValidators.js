const { body, param } = require('express-validator');

// Portfolio validation rules
const createPortfolioValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('assets').isArray({ min: 1 }).withMessage('At least one asset is required'),
  body('assets.*').notEmpty().withMessage('Asset symbols cannot be empty'),
  body('weights').isArray({ min: 1 }).withMessage('Weights array is required'),
  body('weights.*').isFloat({ min: 0, max: 1 }).withMessage('Weights must be between 0 and 1'),
  body('initialBalance').isFloat({ gt: 0 }).withMessage('Initial balance must be positive'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
];

const updatePortfolioValidation = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('assets').optional().isArray({ min: 1 }).withMessage('At least one asset is required'),
  body('assets.*').optional().notEmpty().withMessage('Asset symbols cannot be empty'),
  body('weights').optional().isArray({ min: 1 }).withMessage('Weights array is required'),
  body('weights.*').optional().isFloat({ min: 0, max: 1 }).withMessage('Weights must be between 0 and 1'),
  body('initialBalance').optional().isFloat({ gt: 0 }).withMessage('Initial balance must be positive'),
  body('currentBalance').optional().isFloat({ gt: 0 }).withMessage('Current balance must be positive'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const getPortfolioValidation = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
];

const deletePortfolioValidation = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
];

const rebalancePortfolioValidation = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
  body('newWeights').optional().isArray({ min: 1 }).withMessage('New weights must be an array'),
  body('newWeights.*').optional().isFloat({ min: 0, max: 1 }).withMessage('Weights must be between 0 and 1'),
  body('targetValue').optional().isFloat({ gt: 0 }).withMessage('Target value must be positive'),
];

module.exports = {
  createPortfolioValidation,
  updatePortfolioValidation,
  getPortfolioValidation,
  deletePortfolioValidation,
  rebalancePortfolioValidation,
};