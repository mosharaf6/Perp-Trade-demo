import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config/constants';

const NetworkStatus = ({ account, provider }) => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (!provider) return;
      
      try {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const expectedChainId = Number(CONFIG.NETWORK_ID);
        
        setCurrentNetwork({
          chainId,
          name: getNetworkName(chainId)
        });
        
        setIsCorrectNetwork(chainId === expectedChainId);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    };

    const handleChainChange = (chainId) => {
      checkNetwork();
      // Refresh the page to ensure clean state
      window.location.reload();
    };

    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChange);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChange);
      };
    }
  }, [provider]);

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai'
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const switchToCorrectNetwork = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed');
      return;
    }

    setIsLoading(true);
    
    try {
      const targetChainId = '0x' + Number(CONFIG.NETWORK_ID).toString(16);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network doesn't exist, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + Number(CONFIG.NETWORK_ID).toString(16),
              chainName: CONFIG.NETWORK_NAME,
              rpcUrls: [`https://sepolia.infura.io/v3/${CONFIG.INFURA_ID}`],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              }
            }]
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!account || !currentNetwork) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.status,
        backgroundColor: isCorrectNetwork ? '#10b981' : '#ef4444'
      }}>
        <div style={styles.networkInfo}>
          <span style={styles.dot}></span>
          <span style={styles.networkText}>
            {currentNetwork.name}
          </span>
        </div>
        
        {!isCorrectNetwork && (
          <button
            onClick={switchToCorrectNetwork}
            disabled={isLoading}
            style={styles.switchButton}
          >
            {isLoading ? 'Switching...' : `Switch to ${CONFIG.NETWORK_NAME}`}
          </button>
        )}
      </div>
      
      {!isCorrectNetwork && (
        <div style={styles.warning}>
          ⚠️ Please switch to {CONFIG.NETWORK_NAME} to use this app
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 1000,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    borderRadius: 24,
    color: 'white',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  networkInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'white',
    animation: 'pulse 2s infinite'
  },
  networkText: {
    fontSize: 13,
    fontWeight: 500
  },
  switchButton: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: 16,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.3)'
    }
  },
  warning: {
    marginTop: 8,
    padding: '8px 16px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 8,
    fontSize: 12,
    textAlign: 'center',
    border: '1px solid #fbbf24'
  }
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  if (!document.head.querySelector('style[data-network-styles]')) {
    styleSheet.setAttribute('data-network-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default NetworkStatus;
