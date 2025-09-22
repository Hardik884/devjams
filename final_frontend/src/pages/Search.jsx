import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import useDebounce from '../hooks/useDebounce.js'
import StockCard from '../components/StockCard.jsx'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.searchStocks(debouncedQuery, 20)
        console.log('Search API response:', res.data) // Debug log
        
        // Handle different response structures
        let stocksData = []
        if (res.data) {
          if (Array.isArray(res.data)) {
            stocksData = res.data
          } else if (res.data.stocks && Array.isArray(res.data.stocks)) {
            stocksData = res.data.stocks
          } else if (res.data.data && Array.isArray(res.data.data)) {
            stocksData = res.data.data
          }
        }
        
        setResults(stocksData)
      } catch (e) {
        console.error('Search API error:', e)
        setError(e.response?.data?.error || e.message || 'Search failed')
        setResults([]) // Ensure results is always an array
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [debouncedQuery])

  const addToWishlist = async (symbol) => {
    try {
      await api.addStockToWishlist({ 
        symbol, 
        notes: 'Added from search'
      })
      alert(`${symbol} added to wishlist`)
    } catch (e) {
      console.error('Add to wishlist error:', e)
      let errorMessage = 'Failed to add to wishlist'
      if (e.response?.status === 400 && e.response?.data?.errors) {
        const validationErrors = e.response.data.errors.map(err => err.msg).join(', ')
        errorMessage = `Validation failed: ${validationErrors}`
      } else if (e.response?.data?.error || e.response?.data?.message) {
        errorMessage = e.response.data.error || e.response.data.message
      }
      alert(errorMessage)
    }
  }

  return (
    <div>
      <h2>Search Indian Stocks</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <input 
          className="input" 
          placeholder="Search by symbol (e.g., RELIANCE, TCS) or company name..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          style={{ width: '100%', maxWidth: '500px' }}
        />
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--muted)', 
          marginTop: '0.5rem',
          maxWidth: '500px'
        }}>
          💡 Try searching for any NSE/BSE stock symbol like INFY, HDFCBANK, LT, SBIN, ITC, etc.
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Searching...
        </div>
      )}
      
      {error && (
        <div style={{color:'var(--indian-red)', textAlign: 'center', padding: '1rem'}}>
          Error: {error}
        </div>
      )}

      {query && !loading && (!Array.isArray(results) || results.length === 0) && !error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div>No stocks found for "{query}"</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--muted)' }}>
            Try searching with the exact stock symbol (e.g., "RELIANCE" instead of "Reliance Industries")
          </div>
        </div>
      )}

      {!query && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <h3>Popular Indian Stocks</h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem', 
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'LT', 'SBIN'].map(symbol => (
              <button 
                key={symbol}
                className="btn ghost"
                onClick={() => setQuery(symbol)}
                style={{ fontSize: '0.875rem' }}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid">
        {Array.isArray(results) && results.map(stock => (
          <div key={stock.symbol || stock.id || Math.random()} className="card">
            <StockCard stock={stock} onAddWishlist={addToWishlist} />
            <div style={{marginTop: 8}}>
              <Link to={`/stocks/${stock.symbol}`} className="btn">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
