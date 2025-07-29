import React from 'react';
import { CONFIG } from '../config/constants';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error in development
    if (CONFIG.IS_DEVELOPMENT) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Oops! Something went wrong</h2>
            <p style={styles.description}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>
            
            <div style={styles.actions}>
              <button 
                onClick={() => window.location.reload()} 
                style={styles.button}
              >
                🔄 Reload Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                ↩️ Try Again
              </button>
            </div>

            {CONFIG.IS_DEVELOPMENT && this.state.error && (
              <details style={styles.errorDetails}>
                <summary style={styles.errorSummary}>Error Details (Development)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.footer}>
              <p style={styles.footerText}>
                If this problem persists, please{' '}
                <a 
                  href={CONFIG.SUPPORT_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 40,
    maxWidth: 500,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
  },
  icon: {
    fontSize: 48,
    marginBottom: 20
  },
  title: {
    color: '#333',
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 600
  },
  description: {
    color: '#666',
    marginBottom: 30,
    lineHeight: 1.5
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 30
  },
  button: {
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    fontSize: 14
  },
  secondaryButton: {
    background: '#f8f9fa',
    color: '#333',
    border: '1px solid #e0e0e0'
  },
  errorDetails: {
    textAlign: 'left',
    marginTop: 20,
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e0e0e0'
  },
  errorSummary: {
    cursor: 'pointer',
    fontWeight: 600,
    color: '#dc3545',
    marginBottom: 10
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    overflow: 'auto',
    maxHeight: 200
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #e0e0e0'
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    margin: 0
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 500
  }
};

export default ErrorBoundary;
