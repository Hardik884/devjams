import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { api } from '../services/api.js'
import { formatPrice } from '../utils/format.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

export default function StockChart({ symbol }) {
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('1mo')

  const periods = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'max', label: 'MAX' }
  ]

  const fetchChartData = async (period) => {
    if (!symbol) return

    setLoading(true)
    setError('')
    
    try {
      console.log(`Fetching chart data for ${symbol}, period: ${period}`)
      
      // Determine interval based on period
      let interval = '1d'
      if (period === '1d') interval = '15m'
      else if (period === '5d') interval = '1h'
      else if (['1mo', '3mo'].includes(period)) interval = '1d'
      else interval = '1wk'

      const response = await api.getStockHistoricalData(symbol, period, interval)
      console.log('Chart API response:', response.data)

      const historicalData = response.data.data || []
      
      if (historicalData.length === 0) {
        setError('No historical data available')
        return
      }

      // Prepare data for Chart.js
      const labels = historicalData.map(item => {
        const date = new Date(item.date)
        if (period === '1d') {
          return date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          })
        } else {
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            ...(period === 'max' || period === '1y' ? { year: '2-digit' } : {})
          })
        }
      })

      const prices = historicalData.map(item => item.close)
      const volumes = historicalData.map(item => item.volume)

      // Calculate price change for color
      const firstPrice = prices[0]
      const lastPrice = prices[prices.length - 1]
      const isPositive = lastPrice >= firstPrice

      setChartData({
        labels,
        datasets: [
          {
            label: 'Price (₹)',
            data: prices,
            borderColor: isPositive ? '#22c55e' : '#ef4444',
            backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4,
          }
        ]
      })

    } catch (e) {
      console.error('Chart data fetch error:', e)
      setError(e.response?.data?.error || e.message || 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData(selectedPeriod)
  }, [symbol, selectedPeriod])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `₹${formatPrice(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + formatPrice(value)
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0
      }
    }
  }

  if (!symbol) {
    return null
  }

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <h3>Price Chart</h3>
        <div className="period-selector">
          {periods.map(period => (
            <button
              key={period.value}
              className={`period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
              disabled={loading}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {loading && (
          <div className="chart-loading">
            Loading chart data...
          </div>
        )}

        {error && (
          <div className="chart-error">
            <div style={{ color: 'var(--indian-red)', marginBottom: '1rem' }}>
              {error}
            </div>
            <button onClick={() => fetchChartData(selectedPeriod)} className="btn ghost">
              Retry
            </button>
          </div>
        )}

        {chartData && !loading && !error && (
          <div style={{ height: '400px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  )
}