import React, { useState } from "react";
import { ethers } from "ethers";

function WalletConnect({ onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState("");

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           (window.ethereum.isMetaMask || window.ethereum.providers?.some(p => p.isMetaMask));
  };

  const handleConnect = async () => {
    console.log("Starting wallet connection...");
    
    if (!window.ethereum) {
      alert("No Ethereum wallet detected. Please install MetaMask!");
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (!isMetaMaskInstalled()) {
      console.log("MetaMask not detected, trying anyway...");
    }

    setIsConnecting(true);
    try {
      console.log("Requesting accounts...");
      
      // Try the newer method first
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        console.log("Accounts received:", accounts);
      } catch (error) {
        console.error("eth_requestAccounts failed:", error);
        throw error;
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }

      console.log("Creating provider...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log("Getting signer...");
      const signer = await provider.getSigner();
      
      console.log("Getting address...");
      const address = await signer.getAddress();
      
      console.log("Connection successful! Address:", address);
      setAccount(address);
      
      // Call the onConnect callback with provider, signer, and address
      if (onConnect) {
        onConnect(provider, signer, address);
      }
      
      alert("Wallet connected successfully!");
    } catch (error) {
      console.error("Detailed connection error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 4001) {
        alert("Connection rejected by user");
      } else if (error.code === -32002) {
        alert("Connection request already pending. Please check MetaMask.");
      } else if (error.message?.includes("User denied")) {
        alert("Connection rejected by user");
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount("");
    if (onConnect) {
      onConnect(null, null, "");
    }
  };

  // If wallet is connected, show connected state
  if (account) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 20, 
        background: 'linear-gradient(45deg, #28a745, #20c997)',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <div style={{ color: 'white', marginBottom: 10 }}>
          ✅ Wallet Connected
        </div>
        <div style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontSize: 14, 
          fontFamily: 'monospace',
          marginBottom: 15 
        }}>
          {account.slice(0, 6)}...{account.slice(-4)}
        </div>
        <button 
          onClick={handleDisconnect}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          🚪 Disconnect
        </button>
      </div>
    );
  }

  // If no wallet connected, show connection options
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      {/* Debug info */}
      <div style={{ 
        marginBottom: 15, 
        padding: 10, 
        background: '#f0f0f0', 
        borderRadius: 8, 
        fontSize: 12,
        color: '#666'
      }}>
        <div>Window.ethereum: {window.ethereum ? '✅ Available' : '❌ Not found'}</div>
        <div>MetaMask detected: {isMetaMaskInstalled() ? '✅ Yes' : '❌ No'}</div>
        <div>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</div>
      </div>

      <button 
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          background: 'linear-gradient(45deg, #f6851b, #e2761b)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '16px 32px',
          fontSize: 16,
          fontWeight: 600,
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          marginBottom: 12,
          opacity: isConnecting ? 0.7 : 1
        }}
      >
        🦊 {isConnecting ? "Connecting..." : "Connect MetaMask"}
      </button>
      <br />
      <button 
        onClick={() => alert("WalletConnect integration coming soon!")}
        style={{
          background: 'linear-gradient(45deg, #3b99fc, #1a73e8)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '16px 32px',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 12
        }}
      >
        🔗 WalletConnect (Soon)
      </button>
      <br />
      <button 
        onClick={() => alert("Coinbase Wallet integration coming soon!")}
        style={{
          background: 'linear-gradient(45deg, #0052ff, #0040cc)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '16px 32px',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        🏦 Coinbase Wallet (Soon)
      </button>
      
      {!isMetaMaskInstalled() && (
        <div style={{ 
          marginTop: 20, 
          padding: 15, 
          background: '#f8f9fa', 
          borderRadius: 8,
          fontSize: 14,
          color: '#666'
        }}>
          Don't have MetaMask?{' '}
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}
          >
            Install it here
          </a>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
