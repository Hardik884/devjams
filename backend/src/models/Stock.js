const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  exchange: {
    type: String,
    required: [true, 'Exchange is required'],
    uppercase: true,
    enum: ['NSE', 'BSE'], // Only Indian exchanges
    default: 'NSE',
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    uppercase: true,
    default: 'IN', // Always India
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'INR', // Always Indian Rupees
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata', // Indian timezone
  },
  sector: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  marketCap: {
    type: Number,
    min: 0,
  },
  price: {
    current: {
      type: Number,
      required: true,
      min: 0,
    },
    previousClose: {
      type: Number,
      min: 0,
    },
    dayHigh: {
      type: Number,
      min: 0,
    },
    dayLow: {
      type: Number,
      min: 0,
    },
    fiftyTwoWeekHigh: {
      type: Number,
      min: 0,
    },
    fiftyTwoWeekLow: {
      type: Number,
      min: 0,
    },
  },
  volume: {
    current: {
      type: Number,
      min: 0,
    },
    averageVolume: {
      type: Number,
      min: 0,
    },
  },
  fundamentals: {
    peRatio: {
      type: Number,
    },
    priceToBookRatio: {
      type: Number,
    },
    dividendYield: {
      type: Number,
      min: 0,
      max: 100, // percentage
    },
    eps: {
      type: Number,
    },
    beta: {
      type: Number,
    },
    sharesOutstanding: {
      type: Number,
      min: 0,
    },
  },
  returns: {
    oneDay: {
      type: Number,
    },
    oneWeek: {
      type: Number,
    },
    oneMonth: {
      type: Number,
    },
    threeMonths: {
      type: Number,
    },
    sixMonths: {
      type: Number,
    },
    oneYear: {
      type: Number,
    },
    ytd: {
      type: Number,
    },
  },
  technicalIndicators: {
    rsi: {
      type: Number,
      min: 0,
      max: 100,
    },
    macd: {
      value: Number,
      signal: Number,
      histogram: Number,
    },
    movingAverages: {
      sma20: Number,
      sma50: Number,
      sma200: Number,
      ema12: Number,
      ema26: Number,
    },
    bollingerBands: {
      upper: Number,
      middle: Number,
      lower: Number,
    },
    support: Number,
    resistance: Number,
  },
  openInterest: {
    type: Number,
    min: 0,
  },
  trending: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rank: {
      type: Number,
      min: 1,
    },
    reasons: [{
      type: String,
      enum: ['volume_spike', 'price_momentum', 'news_sentiment', 'analyst_upgrade', 'earnings_beat', 'social_media']
    }],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Indexes for performance
stockSchema.index({ symbol: 1, isActive: 1 });
stockSchema.index({ exchange: 1, isActive: 1 });
stockSchema.index({ 'trending.score': -1, isActive: 1 });
stockSchema.index({ 'trending.rank': 1, isActive: 1 });
stockSchema.index({ lastUpdated: 1 });
stockSchema.index({ marketCap: -1, isActive: 1 });

// Instance methods
stockSchema.methods.calculateTrendingScore = function() {
  let score = 0;
  
  // Volume factor (30%)
  if (this.volume.current && this.volume.averageVolume) {
    const volumeRatio = this.volume.current / this.volume.averageVolume;
    score += Math.min(volumeRatio * 15, 30);
  }
  
  // Price momentum factor (40%)
  if (this.returns.oneDay) {
    score += Math.min(Math.abs(this.returns.oneDay) * 2, 40);
  }
  
  // Technical indicators factor (30%)
  if (this.technicalIndicators.rsi) {
    // RSI extremes (oversold/overbought)
    if (this.technicalIndicators.rsi < 30 || this.technicalIndicators.rsi > 70) {
      score += 15;
    }
  }
  
  if (this.technicalIndicators.movingAverages) {
    // Price above moving averages
    const { sma20, sma50 } = this.technicalIndicators.movingAverages;
    if (sma20 && sma50 && this.price.current > sma20 && sma20 > sma50) {
      score += 15;
    }
  }
  
  this.trending.score = Math.min(score, 100);
  return this.trending.score;
};

stockSchema.methods.getPerformanceMetrics = function() {
  return {
    returns: this.returns,
    volatility: this.technicalIndicators.bollingerBands ? 
      (this.technicalIndicators.bollingerBands.upper - this.technicalIndicators.bollingerBands.lower) / this.price.current : null,
    beta: this.fundamentals.beta,
    sharpeRatio: null, // Would need risk-free rate to calculate
  };
};

// Static methods
stockSchema.statics.getTrendingStocks = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ 'trending.score': -1, 'trending.rank': 1 })
    .limit(limit)
    .select('symbol name exchange price.current returns.oneDay trending marketCap lastUpdated');
};

stockSchema.statics.searchStocks = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { symbol: searchRegex },
      { name: searchRegex },
    ]
  })
    .limit(limit)
    .select('symbol name exchange price.current marketCap');
};

stockSchema.statics.getTopPerformers = function(timeframe = 'oneDay', limit = 20) {
  const sortField = `returns.${timeframe}`;
  return this.find({ isActive: true, [sortField]: { $exists: true } })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .select(`symbol name exchange price.current returns.${timeframe} marketCap`);
};

stockSchema.statics.findByExchange = function(exchange, limit = 100) {
  return this.find({ exchange: exchange.toUpperCase(), isActive: true })
    .sort({ marketCap: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Stock', stockSchema);