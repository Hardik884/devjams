import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      nav('/')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{maxWidth: 520, marginTop: '2rem'}}>
      <div className="card">
        <h2>Register</h2>
        <form onSubmit={onSubmit} style={{display:'grid', gap: 12}}>
          <input 
            className="input" 
            placeholder="First Name" 
            value={form.firstName} 
            onChange={e=>setForm({...form, firstName:e.target.value})} 
            required 
          />
          <input 
            className="input" 
            placeholder="Last Name" 
            value={form.lastName} 
            onChange={e=>setForm({...form, lastName:e.target.value})} 
            required 
          />
          <input 
            className="input" 
            type="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={e=>setForm({...form, email:e.target.value})} 
            required 
          />
          <input 
            className="input" 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={e=>setForm({...form, password:e.target.value})} 
            required 
          />
          {error && <div style={{color:'var(--indian-red)'}}>{error}</div>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem'}}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}
