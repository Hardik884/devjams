import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import { api } from '../services/api'
import './StockChart.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const PortfolioChart = ({ portfolioId }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('1mo')
  const [activeTab, setActiveTab] = useState('performance')

  const periodOptions = [
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'max', label: 'MAX' }
  ]

  const tabs = [
    { id: 'performance', label: 'Performance' },
    { id: 'allocation', label: 'Allocation' },
    { id: 'holdings', label: 'Holdings' }
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [portfolioId, period])

  const fetchAnalytics = async () => {
    if (!portfolioId) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching analytics for portfolio ID:', portfolioId, 'period:', period)
      const response = await api.getPortfolioAnalytics(portfolioId, period)
      
      console.log('Analytics API response:', response)
      console.log('Analytics response data:', response?.data)
      
      if (response?.data) {
        // Handle different response structures
        if (response.data.success && response.data.data) {
          setAnalytics(response.data.data)
          console.log('Analytics data (nested):', response.data.data)
        } else if (response.data.totalInvested !== undefined) {
          setAnalytics(response.data)
          console.log('Analytics data (direct):', response.data)
        } else {
          console.error('Unexpected analytics response structure:', response.data)
          throw new Error('Invalid analytics data structure')
        }
      } else {
        throw new Error('No analytics data received from API')
      }
    } catch (err) {
      console.error('Error fetching portfolio analytics:', err)
      console.error('Error details:', err.response || err)
      setError(err.message || 'Failed to load portfolio analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getPerformanceChartData = () => {
    if (!analytics?.timeline || analytics.timeline.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    return {
      labels: analytics.timeline.map(point => {
        const date = new Date(point.date)
        return date.toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        })
      }),
      datasets: [
        {
          label: 'Portfolio Value',
          data: analytics.timeline.map(point => point.value),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 6
        }
      ]
    }
  }

  const getAllocationChartData = () => {
    if (!analytics?.allocation?.bySector || analytics.allocation.bySector.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
      '#10B981', '#06B6D4', '#8B5CF6', '#F97316', '#84CC16'
    ]

    const sectors = analytics.allocation.bySector.map(item => item.sector)
    const values = analytics.allocation.bySector.map(item => item.value)

    return {
      labels: sectors,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, sectors.length),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    }
  }

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Portfolio Performance (${period.toUpperCase()})`,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#1F2937'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#4F46E5',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Value: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          color: '#6B7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  const allocationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Sector Allocation',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#1F2937'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: function(context) {
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="stock-chart-container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stock-chart-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading portfolio analytics</p>
            <button 
              onClick={fetchAnalytics}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="stock-chart-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stock-chart-container">
      {/* Portfolio Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">Total Invested</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(analytics?.performance?.totalInvested || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">Current Value</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(analytics?.performance?.currentValue || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">Total Gain/Loss</h3>
          <p className={`text-xl font-bold ${(analytics?.performance?.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(analytics?.performance?.totalGainLoss || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">Return %</h3>
          <p className={`text-xl font-bold ${(analytics?.performance?.totalGainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(analytics?.performance?.totalGainLossPercent || 0)}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Chart Content */}
      {activeTab === 'performance' && (
        <div>
          {/* Period Selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  period === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="chart-wrapper">
            <Line data={getPerformanceChartData()} options={performanceChartOptions} />
          </div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div>
          <div className="chart-wrapper">
            <Pie data={getAllocationChartData()} options={allocationChartOptions} />
          </div>
        </div>
      )}

      {activeTab === 'holdings' && (
        <div>
          {analytics?.holdings && analytics.holdings.length > 0 ? (
            <div className="space-y-4">
              {analytics.holdings.map((holding, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{holding.symbol}</h3>
                      <p className="text-sm text-gray-600">
                        {holding.shares} shares @ {formatCurrency(holding.purchasePrice || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(holding.currentValue || 0)}
                      </p>
                      <p className={`text-sm ${(holding.gainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(holding.gainLossPercent || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${((holding.currentValue || 0) / (analytics?.performance?.currentValue || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No holdings data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PortfolioChart