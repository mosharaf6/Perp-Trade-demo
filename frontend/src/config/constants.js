// Configuration constants for the application
export const CONFIG = {
  APP_NAME: process.env.REACT_APP_NAME || "PerpTrade",
  APP_DESCRIPTION: process.env.REACT_APP_DESCRIPTION || "Advanced Perpetual Futures Trading on Ethereum",
  
  // Contract addresses
  PERPETUAL_MANAGER_ADDRESS: process.env.REACT_APP_PERPETUAL_MANAGER_ADDRESS || "0x382e283a634AfE5987296c65b21ec106DF6CE448",
  VAULT_ADDRESS: process.env.REACT_APP_VAULT_ADDRESS || "0xf3915eE83a04c1F0A3d730f4fC389dE41B75871d",
  
  // Network configuration
  NETWORK_ID: parseInt(process.env.REACT_APP_NETWORK_ID || "11155111"),
  NETWORK_NAME: process.env.REACT_APP_NETWORK_NAME || "Sepolia Testnet",
  
  // External APIs
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  
  // UI Configuration
  MAX_LEVERAGE: 10,
  MIN_LEVERAGE: 1,
  DECIMAL_PLACES: 4,
  
  // Transaction settings
  GAS_LIMIT_MULTIPLIER: 1.2,
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  
  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // URLs
  EXPLORER_URL: "https://sepolia.etherscan.io",
  DOCS_URL: "https://docs.perptrade.app",
  SUPPORT_URL: "https://support.perptrade.app"
};

// Network configuration
export const SUPPORTED_NETWORKS = {
  [CONFIG.NETWORK_ID]: {
    name: CONFIG.NETWORK_NAME,
    rpcUrl: CONFIG.INFURA_ID ? `https://sepolia.infura.io/v3/${CONFIG.INFURA_ID}` : "https://rpc.sepolia.org",
    explorerUrl: CONFIG.EXPLORER_URL,
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SepoliaETH",
      decimals: 18
    }
  }
};

// Input validation
export const VALIDATION = {
  MIN_AMOUNT: "0.001", // Minimum amount in ETH
  MAX_AMOUNT: "1000", // Maximum amount in ETH
  AMOUNT_REGEX: /^[0-9]*\.?[0-9]+$/,
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND: "Please install MetaMask or another Ethereum wallet",
  NETWORK_MISMATCH: `Please switch to ${CONFIG.NETWORK_NAME}`,
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
  INVALID_AMOUNT: "Please enter a valid amount",
  TRANSACTION_FAILED: "Transaction failed. Please try again",
  USER_REJECTED: "Transaction was rejected by user",
  POSITION_EXISTS: "You already have an open position",
  NO_POSITION: "No position found to close"
};

// Success messages
export const SUCCESS_MESSAGES = {
  DEPOSIT_SUCCESS: "Collateral deposited successfully!",
  WITHDRAW_SUCCESS: "Collateral withdrawn successfully!",
  POSITION_OPENED: "Position opened successfully!",
  POSITION_CLOSED: "Position closed successfully!",
  WALLET_CONNECTED: "Wallet connected successfully!"
};
