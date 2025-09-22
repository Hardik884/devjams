import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Indian Stocks
      </Link>

      {isAuthenticated && (
        <div className="nav-links">
          <NavLink to="/">Trending</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/portfolios">Portfolios</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
        </div>
      )}

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <span>Hello, {user?.firstName || 'User'}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn">Login</NavLink>
            <NavLink to="/register" className="btn btn-primary">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
