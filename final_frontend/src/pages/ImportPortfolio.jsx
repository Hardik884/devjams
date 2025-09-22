import React, { useState } from 'react'
import { api } from '../services/api.js'

export default function ImportPortfolio() {
  const [file, setFile] = useState(null)
  const [portfolioName, setPortfolioName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert('Please select a file to upload')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('portfolioName', portfolioName)

    setLoading(true)
    try {
      const res = await api.importPortfolio(formData)
      setMessage(res.message || 'Portfolio imported successfully')
    } catch (e) {
      setMessage('Failed to import portfolio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Import Portfolio</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Portfolio Name"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          required
        />
        <input type="file" onChange={handleFileChange} accept=".csv, .xlsx, .xls" required />
        <button className="btn" disabled={loading}>
          {loading ? 'Importing...' : 'Import Portfolio'}
        </button>
      </form>
      {message && <div>{message}</div>}
    </div>
  )
}
