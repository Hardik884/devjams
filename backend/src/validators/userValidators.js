const { body, param, query } = require('express-validator');

// Auth validation rules
const registerValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  body('riskProfile').optional().isObject().withMessage('Risk profile must be an object'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// User management validation rules
const getUserByIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

const updateUserValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('riskProfile').optional().isObject().withMessage('Risk profile must be an object'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
];

const deleteUserValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

const getAllUsersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().toBoolean().withMessage('isActive must be boolean'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
];

module.exports = {
  // Auth validators
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  // User management validators
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
  getAllUsersValidation,
};