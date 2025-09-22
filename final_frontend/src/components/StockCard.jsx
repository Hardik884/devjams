import React from 'react'
import { formatPrice, formatPercentage } from '../utils/format.js'

export default function StockCard({ stock, onAddWishlist }) {
  // Defensive checks to ensure stock object exists
  if (!stock) {
    return (
      <div className="stock-card">
        <p>Invalid stock data</p>
      </div>
    )
  }

  // Handle different price object structures from backend with safety checks
  const currentPrice = stock.price?.current || stock.currentPrice || stock.price || 0
  const change = stock.price?.change || stock.change || 0
  const changePercent = stock.price?.changePercent || stock.changePercent || 0
  const symbol = stock.symbol || 'N/A'
  const name = stock.name || ''

  const handleAddToWishlist = () => {
    if (onAddWishlist && symbol && symbol !== 'N/A') {
      onAddWishlist(symbol)
    }
  }

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h3>{symbol}</h3>
        <button 
          onClick={handleAddToWishlist}
          className="btn ghost"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
          disabled={!symbol || symbol === 'N/A'}
        >
          + Wishlist
        </button>
      </div>
      
      {name && (
        <p className="stock-name">{name}</p>
      )}
      
      <div className="stock-price">
        <div className="price-main">₹{formatPrice(currentPrice)}</div>
        {change !== 0 && (
          <div className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '+' : ''}₹{formatPrice(Math.abs(change))}
            {changePercent !== 0 && (
              <span> ({change >= 0 ? '+' : ''}{formatPercentage(changePercent)}%)</span>
            )}
          </div>
        )}
      </div>

      {stock.marketCap && (
        <div className="stock-info">
          <small>Market Cap: ₹{formatPrice(stock.marketCap)}</small>
        </div>
      )}

      {stock.volume && (
        <div className="stock-info">
          <small>Volume: {stock.volume.toLocaleString()}</small>
        </div>
      )}
    </div>
  )
}
