import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api.js'
import PortfolioChart from '../components/PortfolioChart.jsx'

export default function PortfolioDetails() {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Loading portfolio with ID:', id)
      const res = await api.getPortfolioById(id)
      console.log('Portfolio API response:', res) // Debug log
      console.log('Response data:', res.data) // Debug log
      console.log('Response status:', res.status) // Debug log
      
      // Check if we have response data
      if (res?.data) {
        // If the backend returns { success: true, data: portfolioData }
        if (res.data.success && res.data.data) {
          setPortfolio(res.data.data)
          console.log('Portfolio data (nested):', res.data.data) // Debug log
        } 
        // If the backend returns portfolioData directly
        else if (res.data.name || res.data._id) {
          setPortfolio(res.data)
          console.log('Portfolio data (direct):', res.data) // Debug log
        }
        // If it's wrapped in success but data is at root level
        else if (res.data.success) {
          setPortfolio(res.data)
          console.log('Portfolio data (success wrapper):', res.data) // Debug log
        }
        else {
          console.error('Unexpected response structure:', res.data)
          throw new Error('Invalid portfolio data structure')
        }
      } else {
        throw new Error('No data received from API')
      }
    } catch (e) {
      console.error('Portfolio loading error:', e) // Debug log
      console.error('Error response:', e.response) // Debug log
      setError(e.message || 'Failed to load portfolio details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortfolio()
  }, [id])

  const deleteHolding = async (holdingId) => {
    if (window.confirm('Are you sure you want to remove this holding?')) {
      try {
        await api.deleteHolding(id, holdingId)
        await loadPortfolio()
      } catch (e) {
        alert('Failed to remove holding')
      }
    }
  }

  if (loading) return <div>Loading portfolio...</div>
  if (error) return <div style={{ color: 'var(--indian-red)' }}>Error: {error}</div>
  if (!portfolio) return null

  return (
    <div>
      <h2>{portfolio.name || 'Unnamed Portfolio'}</h2>
      <p>{portfolio.description || 'No description available'}</p>
      <p>Total Value: ₹{portfolio.totalValue || '0'}</p>
      <p>P&L: ₹{portfolio.totalGainLoss || '0'} ({portfolio.totalGainLossPercent || '0'}%)</p>

      {/* Portfolio Analytics Chart */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Portfolio Analytics</h3>
        <PortfolioChart portfolioId={id} />
      </div>

      <h3>Holdings</h3>
      <div className="grid">
        {portfolio.holdings && portfolio.holdings.length > 0 ? (
          portfolio.holdings.map((holding) => (
            <div key={holding.id} className="card">
              <p>{holding.symbol}</p>
              <p>Quantity: {holding.quantity}</p>
              <p>Average Price: ₹{holding.averagePrice}</p>
              <p>Current Value: ₹{holding.currentValue}</p>
              <button className="btn ghost" onClick={() => deleteHolding(holding.id)}>Remove Holding</button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No holdings found</p>
          </div>
        )}
      </div>

      <Link to={`/portfolios/${portfolio.id || id}/edit`} className="btn ghost">Edit Portfolio</Link>
    </div>
  )
}
