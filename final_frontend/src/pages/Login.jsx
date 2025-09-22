import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      nav('/')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{maxWidth: 420, marginTop: '2rem'}}>
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} style={{display:'grid', gap: 12}}>
          <input 
            className="input" 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required 
          />
          <input 
            className="input" 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          {error && <div style={{color:'var(--indian-red)'}}>{error}</div>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem'}}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}
