const Wishlist = require('../models/Wishlist');
const Stock = require('../models/Stock');
const logger = require('../utils/logger');

/**
 * Get user's wishlist with enriched stock data
 */
const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findByUser(req.user.id);
    
    if (!wishlist) {
      // Create default wishlist for user
      wishlist = await Wishlist.createForUser(req.user.id);
    }

    // Populate stock details for each item
    await wishlist.populate('items.stock');

    // Add current stock prices and calculate performance
    const enrichedItems = await Promise.all(
      wishlist.items.map(async (item) => {
        const stock = item.stock;
        if (!stock) return item;

        const itemObj = item.toObject();
        itemObj.currentPrice = stock.price?.current || 0;
        itemObj.priceChange = stock.price?.current - stock.price?.previousClose || 0;
        itemObj.priceChangePercent = stock.price?.previousClose 
          ? ((stock.price.current - stock.price.previousClose) / stock.price.previousClose * 100).toFixed(2)
          : 0;
        
        // Calculate target price status
        if (itemObj.targetPrice) {
          itemObj.targetPriceStatus = itemObj.currentPrice >= itemObj.targetPrice ? 'reached' : 'pending';
          itemObj.targetPriceDistance = ((itemObj.targetPrice - itemObj.currentPrice) / itemObj.currentPrice * 100).toFixed(2);
        }

        return itemObj;
      })
    );

    res.json({
      success: true,
      data: {
        ...wishlist.toObject(),
        items: enrichedItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add stock to wishlist
 */
const addStockToWishlist = async (req, res, next) => {
  try {
    const { symbol, notes, targetPrice, alertPrice } = req.body;

    // Check if stock exists in our database
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Indian stock ${symbol.toUpperCase()} not found in our database`,
      });
    }

    // Get or create user's wishlist
    let wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      wishlist = await Wishlist.createForUser(req.user.id);
    }

    // Add stock to wishlist
    await wishlist.addStock({
      stockId: stock._id,
      symbol: symbol.toUpperCase(),
      notes,
      targetPrice,
      alertPrice,
    });

    // Return the updated wishlist
    await wishlist.populate('items.stock');

    res.status(201).json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} added to wishlist successfully`,
      data: wishlist,
    });
  } catch (error) {
    if (error.message.includes('already in your wishlist')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Remove stock from wishlist
 */
const removeStockFromWishlist = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    await wishlist.removeStock(symbol);

    res.json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} removed from wishlist successfully`,
      data: wishlist,
    });
  } catch (error) {
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Update stock in wishlist
 */
const updateStockInWishlist = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const updateData = req.body;

    const wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    await wishlist.updateItem(symbol, updateData);
    await wishlist.populate('items.stock');

    res.json({
      success: true,
      message: `Stock ${symbol.toUpperCase()} updated in wishlist successfully`,
      data: wishlist,
    });
  } catch (error) {
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Update wishlist settings
 */
const updateWishlistSettings = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findByUser(req.user.id);
    if (!wishlist) {
      wishlist = await Wishlist.createForUser(req.user.id, req.body);
    } else {
      Object.assign(wishlist, req.body);
      await wishlist.save();
    }

    res.json({
      success: true,
      message: 'Wishlist updated successfully',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addStockToWishlist,
  removeStockFromWishlist,
  updateStockInWishlist,
  updateWishlistSettings,
};