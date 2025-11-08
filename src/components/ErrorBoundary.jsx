import { Component } from 'react'
import Card from './common/Card'
import Button from './common/Button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          background: 'var(--color-background)'
        }}>
          <Card variant="elevated" padding="xl" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-danger-500)'
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
              fontSize: 'var(--text-lg)'
            }}>
              We encountered an unexpected error. Don't worry, your progress is saved.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'var(--color-gray-100)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'monospace'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: 'var(--space-2)', fontWeight: 'bold' }}>
                  Error Details (Development Only)
                </summary>
                <div style={{ color: 'var(--color-danger-600)' }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre style={{
                    marginTop: 'var(--space-2)',
                    overflow: 'auto',
                    fontSize: 'var(--text-xs)'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" onClick={this.handleReload}>
                Reload Page
              </Button>
              <Button variant="outline" size="lg" onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
