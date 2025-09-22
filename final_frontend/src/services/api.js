import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export class StockAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 1500000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(config => {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  request(method, url, data, params, headers = {}) {
    const config = { method, url, data, params }
    
    // Handle FormData
    if (data instanceof FormData) {
      // Let axios handle the Content-Type for FormData
      delete headers['Content-Type']
    }
    
    if (Object.keys(headers).length > 0) {
      config.headers = { ...config.headers, ...headers }
    }
    
    return this.client.request(config)
  }

  // ========== Authentication APIs ==========
  async register(userData) {
    const response = await this.request('POST', '/auth/register', userData)
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    return response
  }

  async login(email, password) {
    const response = await this.request('POST', '/auth/login', { email, password })
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    return response
  }

  async me() {
    return this.request('GET', '/auth/me')
  }

  async updateProfile(userData) {
    return this.request('PUT', '/auth/update-profile', userData)
  }

  async changePassword(passwordData) {
    return this.request('PUT', '/auth/change-password', passwordData)
  }

  async logout() {
    const response = await this.request('POST', '/auth/logout')
    localStorage.removeItem('authToken')
    return response
  }

  // ========== Stock APIs ==========
  async getTrending(limit = 10) {
    return this.request('GET', '/stocks/trending', null, { limit })
  }

  async searchStocks(query, limit = 20) {
    return this.request('GET', '/stocks/search', null, { q: query, limit })
  }

  async getTopPerformers(timeframe = '1d', limit = 10) {
    return this.request('GET', '/stocks/top-performers', null, { timeframe, limit })
  }

  async getStockBySymbol(symbol) {
    return this.request('GET', `/stocks/${symbol}`)
  }

  async getStockTechnicals(symbol) {
    return this.request('GET', `/stocks/${symbol}/technicals`)
  }

  async getStockHistoricalData(symbol, period = '1mo', interval = '1d') {
    return this.request('GET', `/stocks/${symbol}/historical`, null, { period, interval })
  }

  async refreshStockData(symbol) {
    return this.request('POST', `/stocks/${symbol}/refresh`)
  }

  async getWatchlist() {
    return this.request('GET', '/stocks/watchlist')
  }

  async addToWatchlist(symbol) {
    return this.request('POST', '/stocks/watchlist', { symbol })
  }

  async getExchanges() {
    return this.request('GET', '/stocks/exchanges')
  }

  // ========== Portfolio APIs ==========
  async getPortfolios() {
    return this.request('GET', '/portfolios')
  }

  async createPortfolio(portfolioData) {
    return this.request('POST', '/portfolios', portfolioData)
  }

  async getPortfolioById(id) {
    return this.request('GET', `/portfolios/${id}`)
  }

  async importPortfolio(formData) {
    return this.request('POST', '/portfolios/import', formData, null, {
      'Content-Type': 'multipart/form-data'
    })
  }

  async getPortfolioAnalytics(id, period = '1mo') {
    return this.request('GET', `/portfolios/${id}/analytics`, null, { period })
  }

  async updatePortfolio(id, portfolioData) {
    return this.request('PUT', `/portfolios/${id}`, portfolioData)
  }

  async deletePortfolio(id) {
    return this.request('DELETE', `/portfolios/${id}`)
  }

  async importPortfolio(file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.client.post('/portfolios/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // ========== Wishlist APIs ==========
  async getWishlist() {
    return this.request('GET', '/wishlist')
  }

  async addStockToWishlist(stockData) {
    return this.request('POST', '/wishlist/stocks', stockData)
  }

  async removeStockFromWishlist(symbol) {
    return this.request('DELETE', `/wishlist/stocks/${symbol}`)
  }

  async updateStockInWishlist(symbol, stockData) {
    return this.request('PUT', `/wishlist/stocks/${symbol}`, stockData)
  }

  async updateWishlistSettings(settings) {
    return this.request('PUT', '/wishlist', settings)
  }

  // ========== User Management APIs ==========
  async getAllUsers(params = {}) {
    return this.request('GET', '/users', null, params)
  }

  async getUserById(id) {
    return this.request('GET', `/users/${id}`)
  }

  async updateUser(id, userData) {
    return this.request('PUT', `/users/${id}`, userData)
  }

  async deleteUser(id) {
    return this.request('DELETE', `/users/${id}`)
  }
}

export const api = new StockAPI()
