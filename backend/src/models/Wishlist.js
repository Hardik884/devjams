const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  targetPrice: {
    type: Number,
    min: 0,
  },
  alertPrice: {
    type: Number,
    min: 0,
  },
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: 'My Wishlist',
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  items: [wishlistItemSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  totalValue: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.symbol': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });
wishlistSchema.index({ tags: 1 });

// Ensure user can only have one wishlist
wishlistSchema.index({ user: 1 }, { unique: true });

// Virtual for item count
wishlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Method to add stock to wishlist
wishlistSchema.methods.addStock = function(stockData) {
  // Check if stock already exists
  const existingItem = this.items.find(item => item.symbol === stockData.symbol.toUpperCase());
  if (existingItem) {
    throw new Error(`Stock ${stockData.symbol} is already in your wishlist`);
  }

  this.items.push({
    stock: stockData.stockId,
    symbol: stockData.symbol.toUpperCase(),
    notes: stockData.notes,
    targetPrice: stockData.targetPrice,
    alertPrice: stockData.alertPrice,
    addedAt: new Date(),
  });

  return this.save();
};

// Method to remove stock from wishlist
wishlistSchema.methods.removeStock = function(symbol) {
  const itemIndex = this.items.findIndex(item => item.symbol === symbol.toUpperCase());
  if (itemIndex === -1) {
    throw new Error(`Stock ${symbol} not found in wishlist`);
  }

  this.items.splice(itemIndex, 1);
  return this.save();
};

// Method to update wishlist item
wishlistSchema.methods.updateItem = function(symbol, updateData) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (!item) {
    throw new Error(`Stock ${symbol} not found in wishlist`);
  }

  Object.assign(item, updateData);
  return this.save();
};

// Static method to find user's wishlist
wishlistSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate('items.stock');
};

// Static method to create default wishlist for user
wishlistSchema.statics.createForUser = function(userId, options = {}) {
  return this.create({
    user: userId,
    name: options.name || 'My Watchlist',
    description: options.description || 'My Indian stock watchlist',
    currency: 'INR',
    ...options,
  });
};

// Pre-save middleware to update total value
wishlistSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    // Calculate total value based on current prices
    let totalValue = 0;
    
    for (const item of this.items) {
      try {
        const stock = await mongoose.model('Stock').findById(item.stock);
        if (stock && stock.price && stock.price.current) {
          totalValue += stock.price.current;
        }
      } catch (error) {
        // Continue if stock not found or price unavailable
        continue;
      }
    }
    
    this.totalValue = totalValue;
  }
  next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;