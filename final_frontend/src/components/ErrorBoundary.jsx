import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            There was an error loading this component.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '1rem', 
                borderRadius: '4px', 
                overflow: 'auto',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary