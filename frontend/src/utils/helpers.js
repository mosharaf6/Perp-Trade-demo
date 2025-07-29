import { ethers } from 'ethers';
import { CONFIG, VALIDATION, ERROR_MESSAGES } from '../config/constants';

// Format number for display
export const formatNumber = (value, decimals = CONFIG.DECIMAL_PLACES) => {
  if (!value || isNaN(value)) return '0';
  return parseFloat(value).toFixed(decimals);
};

// Format address for display
export const formatAddress = (address, chars = 6) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
};

// Format currency with symbol
export const formatCurrency = (value, symbol = 'ETH', decimals = CONFIG.DECIMAL_PLACES) => {
  return `${formatNumber(value, decimals)} ${symbol}`;
};

// Validate Ethereum address
export const isValidAddress = (address) => {
  return VALIDATION.ADDRESS_REGEX.test(address);
};

// Validate amount input
export const isValidAmount = (amount) => {
  if (!amount || !VALIDATION.AMOUNT_REGEX.test(amount)) return false;
  const numAmount = parseFloat(amount);
  return numAmount >= parseFloat(VALIDATION.MIN_AMOUNT) && 
         numAmount <= parseFloat(VALIDATION.MAX_AMOUNT);
};

// Convert Wei to ETH
export const weiToEth = (weiValue) => {
  try {
    return ethers.formatEther(weiValue);
  } catch (error) {
    console.error('Error converting Wei to ETH:', error);
    return '0';
  }
};

// Convert ETH to Wei
export const ethToWei = (ethValue) => {
  try {
    return ethers.parseEther(ethValue.toString());
  } catch (error) {
    console.error('Error converting ETH to Wei:', error);
    return ethers.parseEther('0');
  }
};

// Calculate position size with leverage
export const calculatePositionSize = (margin, leverage) => {
  return parseFloat(margin) * parseFloat(leverage);
};

// Calculate liquidation price (simplified)
export const calculateLiquidationPrice = (entryPrice, leverage, isLong) => {
  const liquidationMultiplier = isLong ? (1 - 1 / leverage) : (1 + 1 / leverage);
  return parseFloat(entryPrice) * liquidationMultiplier;
};

// Get explorer URL for transaction
export const getExplorerUrl = (txHash, type = 'tx') => {
  return `${CONFIG.EXPLORER_URL}/${type}/${txHash}`;
};

// Parse transaction error
export const parseTransactionError = (error) => {
  if (!error) return ERROR_MESSAGES.TRANSACTION_FAILED;
  
  // User rejected transaction
  if (error.code === 4001 || error.message?.includes('User denied')) {
    return ERROR_MESSAGES.USER_REJECTED;
  }
  
  // Insufficient funds
  if (error.message?.includes('insufficient funds')) {
    return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
  }
  
  // Network error
  if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Contract revert reasons
  if (error.reason) {
    return error.reason;
  }
  
  // Generic error
  return error.message || ERROR_MESSAGES.TRANSACTION_FAILED;
};

// Debounce function for input handling
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check if current network is supported
export const isSupportedNetwork = (chainId) => {
  return chainId === CONFIG.NETWORK_ID;
};

// Format time duration
export const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

// Generate random ID for notifications
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Safe JSON parse
export const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};
