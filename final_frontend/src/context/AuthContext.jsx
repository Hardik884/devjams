import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      api.me()
        .then(response => {
          setUser(response.data.user || response.data)
        })
        .catch(error => {
          console.error('Failed to get user info:', error)
          localStorage.removeItem('authToken')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const register = async (userData) => {
    try {
      const response = await api.register(userData)
      setUser(response.data.user || response.data)
      return response
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password)
      setUser(response.data.user || response.data)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      setUser(null)
    }
  }

  const updateProfile = async (userData) => {
    try {
      const response = await api.updateProfile(userData)
      setUser(response.data.user || response.data)
      return response
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      updateProfile,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
