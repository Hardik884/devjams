const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Portfolio name is required'],
    trim: true,
    minlength: [2, 'Portfolio name must be at least 2 characters'],
    maxlength: [100, 'Portfolio name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  assets: {
    type: [String],
    required: [true, 'Assets are required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one asset is required',
    },
  },
  weights: {
    type: [Number],
    required: [true, 'Weights are required'],
    validate: {
      validator: function(v) {
        if (!v || v.length === 0) return false;
        if (v.length !== this.assets.length) return false;
        
        // Check if weights sum to approximately 1.0
        const sum = v.reduce((acc, weight) => acc + weight, 0);
        return Math.abs(sum - 1.0) <= 0.001;
      },
      message: 'Weights must sum to 1.0 and match the number of assets',
    },
  },
  initialBalance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    min: [0, 'Initial balance must be positive'],
  },
  currentBalance: {
    type: Number,
    required: false, // Will be set by pre-save middleware if not provided
    min: [0, 'Current balance must be positive'],
  },
  currency: {
    type: String,
    default: 'INR', // Changed to Indian Rupees
    uppercase: true,
    enum: ['INR'], // Only allow INR for Indian market
    minlength: [3, 'Currency must be 3 characters'],
    maxlength: [3, 'Currency must be 3 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  riskProfile: {
    riskTolerance: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    maxDrawdown: {
      type: Number,
      default: 0.2,
      min: 0,
      max: 1,
    },
    targetReturn: {
      type: Number,
      default: 0.08,
      min: 0,
    },
    rebalanceFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'],
      default: 'monthly',
    },
  },
  constraints: {
    minWeight: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 1,
    },
    maxWeight: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 1,
    },
    allowShortSelling: {
      type: Boolean,
      default: false,
    },
    transactionCostPct: {
      type: Number,
      default: 0.001,
      min: 0,
    },
  },
  performance: {
    totalReturn: {
      type: Number,
      default: 0,
    },
    annualizedReturn: {
      type: Number,
      default: 0,
    },
    volatility: {
      type: Number,
      default: 0,
    },
    sharpeRatio: {
      type: Number,
      default: 0,
    },
    maxDrawdown: {
      type: Number,
      default: 0,
    },
    lastRebalanceDate: {
      type: Date,
      default: null,
    },
    lastUpdateDate: {
      type: Date,
      default: Date.now,
    },
  },
  metadata: {
    createdVia: {
      type: String,
      enum: ['manual', 'template', 'ai-generated'],
      default: 'manual',
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better performance
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ isActive: 1 });
portfolioSchema.index({ userId: 1, isActive: 1 });
portfolioSchema.index({ userId: 1, name: 1 }, { unique: true });

// Pre-save middleware
portfolioSchema.pre('save', function(next) {
  // Set currentBalance to initialBalance on creation if not provided
  if (this.isNew && (this.currentBalance === undefined || this.currentBalance === null)) {
    this.currentBalance = this.initialBalance;
  }
  
  // Ensure currentBalance is never null or undefined
  if (this.currentBalance === undefined || this.currentBalance === null) {
    this.currentBalance = this.initialBalance;
  }
  
  // Update lastUpdateDate
  this.performance.lastUpdateDate = new Date();
  
  next();
});

// Instance methods
portfolioSchema.methods.calculatePerformanceMetrics = function() {
  // This would be implemented to calculate real performance metrics
  // For now, return current values
  return this.performance;
};

portfolioSchema.methods.getAssetAllocation = function() {
  return this.assets.map((asset, index) => ({
    symbol: asset,
    weight: this.weights[index],
    allocation: this.weights[index] * this.currentBalance,
  }));
};

portfolioSchema.methods.updateWeights = function(newWeights) {
  if (newWeights.length !== this.assets.length) {
    throw new Error('Number of weights must match number of assets');
  }
  
  const sum = newWeights.reduce((acc, weight) => acc + weight, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error('Weights must sum to 1.0');
  }
  
  this.weights = newWeights;
  this.performance.lastRebalanceDate = new Date();
  
  return this;
};

portfolioSchema.methods.getTotalValue = function() {
  return this.currentBalance;
};

portfolioSchema.methods.getReturnSinceInception = function() {
  if (this.initialBalance === 0) return 0;
  return (this.currentBalance - this.initialBalance) / this.initialBalance;
};

// Static methods
portfolioSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isActive: true };
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

portfolioSchema.statics.findActiveByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Portfolio', portfolioSchema);