import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { formatPrice, formatPercentage } from '../utils/format.js'
import StockChart from '../components/StockChart.jsx'

export default function StockDetails() {
  const { symbol } = useParams()
  const [stock, setStock] = useState(null)
  const [technicals, setTechnicals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStockDetails = async () => {
    if (!symbol) {
      setError('No stock symbol provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    
    console.log('Fetching stock details for symbol:', symbol)
    
    try {
      const [stockRes, technicalRes] = await Promise.allSettled([
        api.getStockBySymbol(symbol),
        api.getStockTechnicals(symbol)
      ])

      console.log('Stock API response:', stockRes)
      console.log('Technicals API response:', technicalRes)

      if (stockRes.status === 'fulfilled') {
        console.log('Full stock API response:', stockRes.value)
        console.log('Stock response data:', stockRes.value.data)
        
        // Backend returns { success: true, data: stockObject, meta: {...} }
        const stockData = stockRes.value.data.data || stockRes.value.data
        console.log('Extracted stock data:', stockData)
        console.log('Stock data type:', typeof stockData)
        console.log('Stock data keys:', stockData ? Object.keys(stockData) : 'no data')
        
        setStock(stockData)
      } else {
        console.error('Stock fetch failed:', stockRes.reason)
        throw new Error(stockRes.reason?.response?.data?.message || 'Failed to fetch stock data')
      }

      if (technicalRes.status === 'fulfilled') {
        console.log('Full technicals API response:', technicalRes.value)
        // Backend returns { success: true, data: technicalsObject }
        const technicalData = technicalRes.value.data.data || technicalRes.value.data
        console.log('Setting technical data:', technicalData)
        console.log('Technical data type:', typeof technicalData)
        
        // Log each indicator type for debugging
        if (technicalData) {
          console.log('RSI type:', typeof technicalData.rsi, technicalData.rsi)
          console.log('MACD type:', typeof technicalData.macd, technicalData.macd)
          console.log('SMA20 type:', typeof technicalData.sma20, technicalData.sma20)
          console.log('Trend type:', typeof technicalData.trend, technicalData.trend)
        }
        
        setTechnicals(technicalData)
      } else {
        console.warn('Technicals fetch failed:', technicalRes.reason)
        // Don't throw error for technicals, it's optional
      }
    } catch (error) {
      console.error('Stock details fetch error:', error)
      setError(error.response?.data?.error || error.message || 'Failed to load stock details')
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async () => {
    try {
      console.log('Adding to wishlist, symbol:', symbol)
      
      const wishlistData = { 
        symbol,
        notes: 'Added from stock details'
      }
      
      // Only include targetPrice and alertPrice if they have values
      // Don't send null values as they might cause validation issues
      
      console.log('Sending wishlist data:', wishlistData)
      
      await api.addStockToWishlist(wishlistData)
      alert(`${symbol} added to wishlist successfully!`)
    } catch (e) {
      console.error('Add to wishlist error:', e)
      console.error('Error response:', e.response?.data)
      
      let errorMessage = 'Failed to add to wishlist'
      if (e.response?.status === 404) {
        errorMessage = `Stock ${symbol} not found in our Indian stock database. Only Indian stocks can be added to wishlist.`
      } else if (e.response?.status === 409) {
        errorMessage = `${symbol} is already in your wishlist`
      } else if (e.response?.status === 400 && e.response?.data?.errors) {
        // Validation errors from express-validator
        const validationErrors = e.response.data.errors.map(err => err.msg).join(', ')
        errorMessage = `Validation failed: ${validationErrors}`
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error
      } else if (e.message) {
        errorMessage = e.message
      }
      
      alert(errorMessage)
    }
  }

  const refreshStockData = async () => {
    try {
      await api.refreshStockData(symbol)
      alert(`Data refresh initiated for ${symbol}. This may take a few moments to complete.`)
      // Refresh current view
      setTimeout(() => {
        fetchStockDetails()
      }, 2000) // Wait 2 seconds then refresh
    } catch (e) {
      console.error('Refresh stock data error:', e)
      alert(e.response?.data?.error || e.message || 'Failed to refresh stock data')
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchStockDetails()
    }
  }, [symbol])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      Loading stock data...
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{color:'var(--indian-red)', marginBottom: '1rem'}}>
        Error: {error}
      </div>
      <button onClick={fetchStockDetails} className="btn">
        Retry
      </button>
    </div>
  )

  if (!stock) {
    console.log('Stock data is null/undefined:', stock)
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Stock not found
        <br />
        <small>Symbol: {symbol}</small>
      </div>
    )
  }

  console.log('Rendering stock details with data:', stock)

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/search" className="btn secondary">← Back to Search</Link>
      </div>

      <div className="card">
        <div className="header">
          <div>
            <h2>{stock.symbol}</h2>
            <h3>{stock.name}</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={refreshStockData} className="btn ghost" title="Refresh all data (price, chart, technicals)">
              🔄 Refresh Data
            </button>
            <button onClick={addToWishlist} className="btn">
              Add to Wishlist
            </button>
          </div>
        </div>

        <div className="stock-price">
          <div className="price-main">
            ₹{formatPrice(stock.price?.current || stock.currentPrice)}
          </div>
          {stock.price?.change && (
            <div className={`price-change ${stock.price.change >= 0 ? 'positive' : 'negative'}`}>
              {stock.price.change >= 0 ? '+' : ''}₹{formatPrice(stock.price.change)} 
              ({stock.price.changePercent >= 0 ? '+' : ''}{formatPercentage(stock.price.changePercent)}%)
            </div>
          )}
        </div>
      </div>

      {/* Stock Chart */}
      <StockChart symbol={symbol} />

      <div className="card">
        <div className="stock-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Market Cap:</span>
              <span>₹{formatPrice(stock.marketCap || 0)}</span>
            </div>
            <div className="info-item">
              <span className="label">Volume:</span>
              <span>{(stock.volume?.current || stock.volume)?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Day High:</span>
              <span>₹{formatPrice(stock.price?.dayHigh || stock.dayHigh || 0)}</span>
            </div>
            <div className="info-item">
              <span className="label">Day Low:</span>
              <span>₹{formatPrice(stock.price?.dayLow || stock.dayLow || 0)}</span>
            </div>
            <div className="info-item">
              <span className="label">52W High:</span>
              <span>₹{formatPrice(stock.price?.fiftyTwoWeekHigh || stock.fiftyTwoWeekHigh || 0)}</span>
            </div>
            <div className="info-item">
              <span className="label">52W Low:</span>
              <span>₹{formatPrice(stock.price?.fiftyTwoWeekLow || stock.fiftyTwoWeekLow || 0)}</span>
            </div>
          </div>
        </div>

        {technicals && !technicals.error && (
          <div className="technicals">
            <h3>Technical Indicators</h3>
            <div className="info-grid">
              {technicals.rsi && (
                <div className="info-item">
                  <span className="label">RSI (14):</span>
                  <span>
                    {typeof technicals.rsi === 'number' 
                      ? technicals.rsi.toFixed(2) 
                      : typeof technicals.rsi === 'object' && technicals.rsi?.value
                        ? technicals.rsi.value.toFixed(2)
                        : 'N/A'
                    }
                  </span>
                </div>
              )}
              {technicals.macd && (
                <div className="info-item">
                  <span className="label">MACD:</span>
                  <span>
                    {typeof technicals.macd === 'number' 
                      ? technicals.macd.toFixed(2) 
                      : typeof technicals.macd === 'object' && technicals.macd?.value
                        ? technicals.macd.value.toFixed(2)
                        : 'N/A'
                    }
                  </span>
                </div>
              )}
              {technicals.sma20 && (
                <div className="info-item">
                  <span className="label">SMA (20):</span>
                  <span>₹{formatPrice(typeof technicals.sma20 === 'number' ? technicals.sma20 : technicals.sma20?.value || 0)}</span>
                </div>
              )}
              {technicals.ema12 && (
                <div className="info-item">
                  <span className="label">EMA (12):</span>
                  <span>₹{formatPrice(typeof technicals.ema12 === 'number' ? technicals.ema12 : technicals.ema12?.value || 0)}</span>
                </div>
              )}
              {technicals.support && (
                <div className="info-item">
                  <span className="label">Support:</span>
                  <span>₹{formatPrice(typeof technicals.support === 'number' ? technicals.support : technicals.support?.value || 0)}</span>
                </div>
              )}
              {technicals.resistance && (
                <div className="info-item">
                  <span className="label">Resistance:</span>
                  <span>₹{formatPrice(typeof technicals.resistance === 'number' ? technicals.resistance : technicals.resistance?.value || 0)}</span>
                </div>
              )}
              {technicals.trend && (
                <div className="info-item">
                  <span className="label">Trend:</span>
                  <span style={{color: (technicals.trend === 'Bullish' || technicals.trend?.value === 'Bullish') ? 'var(--indian-green)' : (technicals.trend === 'Bearish' || technicals.trend?.value === 'Bearish') ? 'var(--indian-red)' : 'inherit'}}>
                    {typeof technicals.trend === 'string' ? technicals.trend : technicals.trend?.value || 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {technicals && technicals.error && (
          <div className="technicals">
            <h3>Technical Indicators</h3>
            <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>
              {technicals.error || 'Technical analysis temporarily unavailable'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
