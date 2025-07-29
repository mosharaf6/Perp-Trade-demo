import React from 'react';

const LoadingSpinner = ({ size = 20, color = '#667eea' }) => (
  <div 
    style={{
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block'
    }}
  />
);

const LoadingButton = ({ children, isLoading, disabled, onClick, style, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    style={{
      ...style,
      opacity: (disabled || isLoading) ? 0.7 : 1,
      cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }}
    {...props}
  >
    {isLoading && <LoadingSpinner size={16} color="#fff" />}
    {children}
  </button>
);

const LoadingOverlay = ({ isVisible, message = "Processing..." }) => {
  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <LoadingSpinner size={40} />
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ title = "Loading...", subtitle }) => (
  <div style={styles.card}>
    <div style={styles.cardContent}>
      <LoadingSpinner size={24} />
      <h3 style={styles.cardTitle}>{title}</h3>
      {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
    </div>
  </div>
);

const SkeletonLine = ({ width = '100%', height = 16, style = {} }) => (
  <div 
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      borderRadius: 4,
      ...style
    }}
  />
);

const SkeletonCard = ({ lines = 3 }) => (
  <div style={styles.skeletonCard}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLine 
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        style={{ marginBottom: index === lines - 1 ? 0 : 8 }}
      />
    ))}
  </div>
);

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998
  },
  content: {
    background: '#fff',
    padding: 40,
    borderRadius: 16,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  message: {
    margin: '20px 0 0 0',
    color: '#333',
    fontSize: 16,
    fontWeight: 500
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  cardTitle: {
    margin: '16px 0 0 0',
    color: '#333',
    fontSize: 18,
    fontWeight: 600
  },
  cardSubtitle: {
    margin: '8px 0 0 0',
    color: '#666',
    fontSize: 14
  },
  skeletonCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #e0e0e0'
  }
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  if (!document.head.querySelector('style[data-loading-styles]')) {
    styleSheet.setAttribute('data-loading-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

// Export components individually for clearer imports
export { LoadingSpinner };
export { LoadingButton };
export { LoadingOverlay };
export { LoadingCard };
export { SkeletonLine };
export { SkeletonCard };
