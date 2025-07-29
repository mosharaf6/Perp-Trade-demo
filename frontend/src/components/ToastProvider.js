import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../utils/helpers';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = generateId();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const handleRemove = () => {
    onRemove(toast.id);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getStyles = () => {
    const baseStyle = { ...styles.toast };
    switch (toast.type) {
      case 'success':
        return { ...baseStyle, background: 'linear-gradient(45deg, #28a745, #20c997)' };
      case 'error':
        return { ...baseStyle, background: 'linear-gradient(45deg, #dc3545, #c82333)' };
      case 'warning':
        return { ...baseStyle, background: 'linear-gradient(45deg, #ffc107, #ff8f00)' };
      default:
        return { ...baseStyle, background: 'linear-gradient(45deg, #667eea, #764ba2)' };
    }
  };

  return (
    <div style={getStyles()}>
      <div style={styles.content}>
        <span style={styles.icon}>{getIcon()}</span>
        <span style={styles.message}>{toast.message}</span>
      </div>
      <button onClick={handleRemove} style={styles.closeButton}>
        ×
      </button>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 400,
    pointerEvents: 'none'
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 8,
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'auto',
    animation: 'slideIn 0.3s ease-out',
    fontSize: 14,
    fontWeight: 500
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    flex: 1
  },
  icon: {
    marginRight: 8,
    fontSize: 16
  },
  message: {
    flex: 1,
    lineHeight: 1.4
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    padding: 0,
    opacity: 0.8,
    transition: 'opacity 0.2s ease'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ToastProvider;
