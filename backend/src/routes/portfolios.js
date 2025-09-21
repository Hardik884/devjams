const express = require('express');
const { validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { uploadPortfolioFile, handleUploadError } = require('../middleware/fileUpload');
const {
  getPortfolios,
  createPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  rebalancePortfolio,
  importPortfolio,
} = require('../controllers/portfolioController');
const {
  createPortfolioValidation,
  updatePortfolioValidation,
  getPortfolioValidation,
  deletePortfolioValidation,
  rebalancePortfolioValidation,
} = require('../validators/portfolioValidators');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// All routes in this file are protected
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Portfolio:
 *       type: object
 *       required:
 *         - name
 *         - assets
 *         - weights
 *         - initialBalance
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         assets:
 *           type: array
 *           items:
 *             type: string
 *         weights:
 *           type: array
 *           items:
 *             type: number
 *         initialBalance:
 *           type: number
 *         currentBalance:
 *           type: number
 *         currency:
 *           type: string
 *         isActive:
 *           type: boolean
 *         riskProfile:
 *           type: object
 *         constraints:
 *           type: object
 *         metadata:
 *           type: object
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: Get all portfolios for the authenticated user
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of portfolios with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Portfolio'
 *                 pagination:
 *                   type: object
 */
router.get('/', getPortfolios);

/**
 * @swagger
 * /api/portfolios:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assets
 *               - weights
 *               - initialBalance
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *               weights:
 *                 type: array
 *                 items:
 *                   type: number
 *               initialBalance:
 *                 type: number
 *               currency:
 *                 type: string
 *               riskProfile:
 *                 type: object
 *               constraints:
 *                 type: object
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createPortfolioValidation, handleValidationErrors, createPortfolio);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: Get portfolio by ID
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio details
 *       404:
 *         description: Portfolio not found
 */
router.get('/:id', getPortfolioValidation, handleValidationErrors, getPortfolioById);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   put:
 *     summary: Update portfolio by ID
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *               weights:
 *                 type: array
 *                 items:
 *                   type: number
 *               initialBalance:
 *                 type: number
 *               currentBalance:
 *                 type: number
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               riskProfile:
 *                 type: object
 *               constraints:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Portfolio updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Portfolio not found
 */
router.put('/:id', updatePortfolioValidation, handleValidationErrors, updatePortfolio);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   delete:
 *     summary: Delete portfolio by ID
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio deleted successfully
 *       404:
 *         description: Portfolio not found
 */
router.delete('/:id', deletePortfolioValidation, handleValidationErrors, deletePortfolio);

/**
 * @swagger
 * /api/portfolios/{id}/rebalance:
 *   post:
 *     summary: Rebalance portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newWeights:
 *                 type: array
 *                 items:
 *                   type: number
 *               targetValue:
 *                 type: number
 *     responses:
 *       200:
 *         description: Portfolio rebalanced successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Portfolio not found
 */
router.post('/:id/rebalance', rebalancePortfolioValidation, handleValidationErrors, rebalancePortfolio);

/**
 * @swagger
 * /api/portfolios/import:
 *   post:
 *     summary: Import portfolio from file
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               portfolioName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Portfolio imported successfully
 *       400:
 *         description: Invalid file or input
 */
router.post('/import', uploadPortfolioFile, handleUploadError, importPortfolio);

module.exports = router;