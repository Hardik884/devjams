import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { formatPrice } from '../utils/format.js'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  console.log('Wishlist component rendered, wishlist:', wishlist) // Debug log
  console.log('Auth token exists:', !!localStorage.getItem('authToken')) // Debug log

  const loadWishlist = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('Making wishlist API call...')
      const res = await api.getWishlist()
      console.log('Wishlist API response full:', res) // Debug log
      console.log('Wishlist API response data:', res.data) // Debug log
      
      // Handle different response structures
      let wishlistData = null
      if (res && res.data) {
        if (res.data.data) {
          // Backend returns { success: true, data: { items: [...] } }
          wishlistData = res.data.data
          console.log('Using res.data.data:', wishlistData)
        } else if (res.data.wishlist) {
          wishlistData = res.data.wishlist
          console.log('Using res.data.wishlist:', wishlistData)
        } else {
          wishlistData = res.data
          console.log('Using res.data:', wishlistData)
        }
      }
      
      // Convert items to stocks for frontend compatibility
      if (wishlistData && wishlistData.items) {
        wishlistData.stocks = wishlistData.items
        console.log('Converted items to stocks:', wishlistData.items.length, 'items')
      } else if (wishlistData && !wishlistData.stocks) {
        wishlistData = { stocks: [] }
        console.log('Created empty stocks array')
      }
      
      console.log('Final processed wishlist data:', wishlistData)
      setWishlist(wishlistData)
      
    } catch (e) {
      console.error('Wishlist API error full:', e)
      console.error('Wishlist API error response:', e.response)
      console.error('Wishlist API error status:', e.response?.status)
      console.error('Wishlist API error data:', e.response?.data)
      setError(e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [])

  const removeWishlistItem = async (symbol) => {
    if (window.confirm('Are you sure you want to remove this stock from the wishlist?')) {
      try {
        await api.removeStockFromWishlist(symbol)
        await loadWishlist()
      } catch (e) {
        alert(e.response?.data?.error || e.message || 'Failed to remove stock from wishlist')
      }
    }
  }

  const startEditing = (item) => {
    setEditingItem(item.symbol)
    setEditForm({
      notes: item.notes || '',
      targetPrice: item.targetPrice || '',
      alertPrice: item.alertPrice || ''
    })
  }

  const saveEdit = async (symbol) => {
    try {
      await api.updateStockInWishlist(symbol, editForm)
      setEditingItem(null)
      setEditForm({})
      await loadWishlist()
    } catch (e) {
      alert(e.response?.data?.error || e.message || 'Failed to update stock')
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditForm({})
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      Loading wishlist...
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: 'var(--indian-red)', marginBottom: '1rem' }}>
        Error: {error}
      </div>
      <button onClick={loadWishlist} className="btn">
        Retry
      </button>
    </div>
  )

  if (!wishlist || !Array.isArray(wishlist.stocks) || wishlist.stocks.length === 0) {
    return (
      <div>
        <div className="header">
          <h2>My Wishlist</h2>
          <Link to="/search" className="btn">Add Stocks</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Your wishlist is empty</h3>
          <p>Start by searching for stocks and adding them to your wishlist.</p>
          <Link to="/search" className="btn">Search Stocks</Link>
        </div>
      </div>
    )
  }

  // Ensure we have a valid wishlist with stocks array
  const stocksArray = (wishlist && Array.isArray(wishlist.stocks)) ? wishlist.stocks : []

  return (
    <div>
      <div className="header">
        <h2>My Wishlist ({stocksArray.length} stocks)</h2>
        <Link to="/search" className="btn">Add More Stocks</Link>
      </div>

      <div className="grid">
        {stocksArray.map((item, index) => (
          <div key={item.symbol || `wishlist-${index}`} className="card">
            <div className="wishlist-item-header">
              <div>
                <h3>{item.symbol}</h3>
                {(item.stock?.name || item.name) && (
                  <p className="stock-name">{item.stock?.name || item.name}</p>
                )}
              </div>
              <div className="wishlist-actions">
                <Link to={`/stocks/${item.symbol}`} className="btn ghost">
                  View Details
                </Link>
                {editingItem === item.symbol ? (
                  <>
                    <button onClick={() => saveEdit(item.symbol)} className="btn ghost">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="btn ghost">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(item)} className="btn ghost">
                      Edit
                    </button>
                    <button 
                      onClick={() => removeWishlistItem(item.symbol)} 
                      className="btn ghost danger"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {(item.stock || item.currentPrice !== undefined) && (
              <div className="stock-price">
                <span>Current Price: ₹{formatPrice(item.currentPrice || item.stock?.currentPrice || 0)}</span>
                {(item.priceChangePercent !== undefined || item.stock?.changePercent !== undefined) && (
                  <span className={(item.priceChangePercent || item.stock?.changePercent || 0) >= 0 ? 'positive' : 'negative'}>
                    {(item.priceChangePercent || item.stock?.changePercent || 0) >= 0 ? '+' : ''}{(item.priceChangePercent || item.stock?.changePercent || 0)}%
                  </span>
                )}
              </div>
            )}

            <div className="wishlist-details">
              {editingItem === item.symbol ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <textarea
                    className="input"
                    placeholder="Notes"
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    rows="2"
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Target Price"
                    value={editForm.targetPrice}
                    onChange={e => setEditForm({ ...editForm, targetPrice: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Alert Price"
                    value={editForm.alertPrice}
                    onChange={e => setEditForm({ ...editForm, alertPrice: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  {item.notes && (
                    <p><strong>Notes:</strong> {item.notes}</p>
                  )}
                  {item.targetPrice && (
                    <p><strong>Target Price:</strong> ₹{formatPrice(item.targetPrice)}</p>
                  )}
                  {item.alertPrice && (
                    <p><strong>Alert Price:</strong> ₹{formatPrice(item.alertPrice)}</p>
                  )}
                  <p className="date-added">
                    Added: {new Date(item.dateAdded).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
