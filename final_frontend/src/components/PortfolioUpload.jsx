import { useState } from 'react'
import { api } from '../services/api'

export default function PortfolioUpload() {
  const [file, setFile] = useState(null)
  const [portfolioName, setPortfolioName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase()
      if (!['csv', 'xlsx', 'xls'].includes(fileType)) {
        setMessage('Please select a CSV or Excel file')
        return
      }
      setFile(selectedFile)
      setMessage('')
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!file || !portfolioName.trim()) {
      setMessage('Please provide a file and portfolio name')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('portfolioName', portfolioName.trim())
      formData.append('description', description.trim())

      const response = await api.importPortfolio(formData)

      if (response.success) {
        setMessage('✅ Portfolio imported successfully!')
        setFile(null)
        setPortfolioName('')
        setDescription('')
        // Reset file input
        e.target.reset()
      } else {
        setMessage(`❌ Import failed: ${response.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage(`❌ Upload failed: ${error.response?.data?.error || error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Import Portfolio from CSV</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio Name *
          </label>
          <input
            type="text"
            id="portfolioName"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Stock Portfolio"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Portfolio description..."
            rows="3"
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            CSV/Excel File *
          </label>
          <input
            type="file"
            id="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Expected columns: Stock Symbol, Quantity, Purchase Price, Purchase Date
          </p>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !portfolioName.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Import Portfolio'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-sm mb-2">CSV Format Example:</h3>
        <pre className="text-xs text-gray-600">
{`Stock Symbol,Quantity,Purchase Price,Purchase Date
RELIANCE.NS,100,2350.75,2024-01-15
TCS.NS,50,3750.25,2024-01-20
HDFCBANK.NS,75,1580.50,2024-02-10`}
        </pre>
      </div>
    </div>
  )
}