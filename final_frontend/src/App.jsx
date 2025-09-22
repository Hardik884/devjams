import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Trending from './pages/Trending.jsx'
import Search from './pages/Search.jsx'
import StockDetails from './pages/StockDetails.jsx'
import Portfolios from './pages/Portfolios.jsx'
import PortfolioDetails from './pages/PortfolioDetails.jsx'
import Wishlist from './pages/Wishlist.jsx'
import ImportPortfolio from './pages/ImportPortfolio.jsx'

export default function App() {
  return (
    <div>
      <NavBar />
      <div className="container">
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Trending />
                </ErrorBoundary>
              </ProtectedRoute>
            } />

            <Route path="/search" element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } />

          <Route path="/stocks/:symbol" element={
            <ProtectedRoute>
              <StockDetails />
            </ProtectedRoute>
          } />

          <Route path="/portfolios" element={
            <ProtectedRoute>
              <Portfolios />
            </ProtectedRoute>
          } />

          <Route path="/portfolios/:id" element={
            <ProtectedRoute>
              <PortfolioDetails />
            </ProtectedRoute>
          } />

          <Route path="/wishlist" element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          } />

          <Route path="/import" element={
            <ProtectedRoute>
              <ImportPortfolio />
            </ProtectedRoute>
          } />
        </Routes>
        </ErrorBoundary>
      </div>
    </div>
  )
}
