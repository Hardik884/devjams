import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { formatPrice, formatPercentage } from '../utils/format.js'

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState([]) // Ensure initial state is an array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

  console.log('Portfolios component rendered, portfolios:', portfolios, 'isArray:', Array.isArray(portfolios)) // Debug log

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      setError('')
      
      const res = await api.getPortfolios()
      console.log('Portfolios API response:', res.data) // Debug log
      
      // Handle different response structures with extra safety
      let portfoliosData = []
      
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          portfoliosData = res.data
        } else if (res.data.portfolios && Array.isArray(res.data.portfolios)) {
          portfoliosData = res.data.portfolios
        } else if (res.data.data && Array.isArray(res.data.data)) {
          portfoliosData = res.data.data
        } else if (typeof res.data === 'object' && res.data !== null) {
          // If it's an object but not an array, try to find array properties
          const possibleArrays = Object.values(res.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            portfoliosData = possibleArrays[0]
          }
        }
      }
      
      // Ensure we always set an array
      if (!Array.isArray(portfoliosData)) {
        portfoliosData = []
      }
      
      console.log('Processed portfolios data:', portfoliosData)
      setPortfolios(portfoliosData)
      
    } catch (e) {
      console.error('Portfolios API error:', e)
      setError(e.response?.data?.error || e.message || 'Failed to load portfolios')
      setPortfolios([]) // Ensure portfolios is always an array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortfolios()
  }, [])

  const createPortfolio = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return

    setCreating(true)
    try {
      await api.createPortfolio(createForm)
      setCreateForm({ name: '', description: '' })
      setShowCreateForm(false)
      await loadPortfolios()
    } catch (e) {
      alert(e.response?.data?.error || e.message || 'Failed to create portfolio')
    } finally {
      setCreating(false)
    }
  }

  const deletePortfolio = async (id) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await api.deletePortfolio(id)
        await loadPortfolios()
      } catch (e) {
        alert(e.response?.data?.error || e.message || 'Failed to delete portfolio')
      }
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      Loading portfolios...
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: 'var(--indian-red)', marginBottom: '1rem' }}>
        Error: {error}
      </div>
      <button onClick={loadPortfolios} className="btn">
        Retry
      </button>
    </div>
  )

  return (
    <div>
      <div className="header">
        <h2>My Portfolios</h2>
        <div>
          <Link to="/import" className="btn secondary" style={{ marginRight: '0.5rem' }}>
            Import Portfolio
          </Link>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn"
          >
            {showCreateForm ? 'Cancel' : 'Create Portfolio'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Create New Portfolio</h3>
          <form onSubmit={createPortfolio} style={{ display: 'grid', gap: '1rem' }}>
            <input
              className="input"
              placeholder="Portfolio Name"
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <textarea
              className="input"
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              rows="3"
            />
            <button type="submit" className="btn" disabled={creating}>
              {creating ? 'Creating...' : 'Create Portfolio'}
            </button>
          </form>
        </div>
      )}

      {!Array.isArray(portfolios) || portfolios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>No portfolios yet</h3>
          <p>Create your first portfolio to start tracking your investments.</p>
        </div>
      ) : (
        <div className="grid">
          {portfolios.map((portfolio, index) => (
            <div key={portfolio._id || portfolio.id || `portfolio-${index}`} className="card">
              <div className="portfolio-header">
                <h3>{portfolio.name}</h3>
                <div className="portfolio-actions">
                  <Link to={`/portfolios/${portfolio._id || portfolio.id}`} className="btn ghost">
                    View Details
                  </Link>
                  <button 
                    className="btn ghost danger" 
                    onClick={() => deletePortfolio(portfolio._id || portfolio.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {portfolio.description && (
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  {portfolio.description}
                </p>
              )}

              <div className="portfolio-stats">
                <div className="stat">
                  <span className="label">Holdings:</span>
                  <span>{portfolio.holdings?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Value:</span>
                  <span>₹{formatPrice(portfolio.totalValue || 0)}</span>
                </div>
                {portfolio.totalGainLoss !== undefined && (
                  <div className="stat">
                    <span className="label">P&L:</span>
                    <span className={portfolio.totalGainLoss >= 0 ? 'positive' : 'negative'}>
                      {portfolio.totalGainLoss >= 0 ? '+' : ''}₹{formatPrice(Math.abs(portfolio.totalGainLoss))}
                      {portfolio.totalGainLossPercent !== undefined && (
                        ` (${formatPercentage(portfolio.totalGainLossPercent)}%)`
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="portfolio-date">
                Created: {new Date(portfolio.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
