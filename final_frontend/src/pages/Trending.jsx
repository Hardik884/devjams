import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import StockCard from '../components/StockCard.jsx'

export default function Trending() {
  const [stocks, setStocks] = useState([]) // Ensure initial state is an array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  console.log('Trending component rendered, stocks:', stocks, 'isArray:', Array.isArray(stocks)) // Debug log

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      
      const res = await api.getTrending(10)
      console.log('Trending API response:', res.data) // Debug log
      
      // Handle different response structures with extra safety
      let stocksData = []
      
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          stocksData = res.data
        } else if (res.data.stocks && Array.isArray(res.data.stocks)) {
          stocksData = res.data.stocks
        } else if (res.data.data && Array.isArray(res.data.data)) {
          stocksData = res.data.data
        } else if (typeof res.data === 'object' && res.data !== null) {
          // If it's an object but not an array, try to find array properties
          const possibleArrays = Object.values(res.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            stocksData = possibleArrays[0]
          }
        }
      }
      
      // Ensure we always set an array
      if (!Array.isArray(stocksData)) {
        stocksData = []
      }
      
      console.log('Processed stocks data:', stocksData)
      setStocks(stocksData)
      
    } catch (e) {
      console.error('Trending API error:', e)
      setError(e.response?.data?.error || e.message || 'Failed to load trending stocks')
      setStocks([]) // Ensure stocks is always an array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000) // Refresh every 30 seconds
    return () => clearInterval(id)
  }, [])

  const addToWishlist = async (symbol) => {
    try {
      await api.addStockToWishlist({ 
        symbol, 
        notes: 'Added from trending'
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      Loading trending stocks...
    </div>
  )
  
  if (error) return (
    <div style={{color:'var(--indian-red)', textAlign: 'center', padding: '2rem'}}>
      Error: {error}
      <button onClick={load} style={{ marginLeft: '1rem' }}>
        Retry
      </button>
    </div>
  )

  // Double check that stocks is an array before rendering
  const stocksArray = Array.isArray(stocks) ? stocks : []

  return (
    <div>
      <div className="header">
        <h2>Trending Stocks</h2>
        <Link to="/search" className="btn secondary">Search Stocks</Link>
      </div>
      
      {stocksArray.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          No trending stocks available at the moment.
        </div>
      ) : (
        <div className="grid">
          {stocksArray.map((s, index) => (
            <div key={s.symbol || s.id || `stock-${index}`} className="card">
              <StockCard stock={s} onAddWishlist={addToWishlist} />
              <div style={{marginTop: 8}}>
                <Link className="btn ghost" to={`/stocks/${s.symbol}`}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
