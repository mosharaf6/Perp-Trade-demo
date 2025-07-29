
import React, { useState, useEffect } from 'react';

import PerpsDapp from './components/PerpsDapp';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import './App.css';

function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const heroStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  };

  const floatingParticles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        width: Math.random() * 6 + 2,
        height: Math.random() * 6 + 2,
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '50%',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
        animationDelay: Math.random() * 2 + 's'
      }}
    />
  ));

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="App">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
            100% { transform: translateY(-20px) rotate(360deg); opacity: 1; }
          }
          @keyframes slideInUp {
            0% { transform: translateY(50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
            50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
          }
          .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
          }
          .cta-button:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          }
        `}
      </style>
      
      <div style={heroStyle}>
        {floatingParticles}
        
        {/* Navigation */}
        <nav style={{ 
          padding: '20px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>⚡ PerpX</div>
          <div style={{ display: 'flex', gap: 30, color: '#fff', fontSize: 16 }}>
            <a href="#features" style={{ color: '#fff', textDecoration: 'none' }}>Features</a>
            <a href="#app" style={{ color: '#fff', textDecoration: 'none' }}>Trade</a>
            <a href="#contact" style={{ color: '#fff', textDecoration: 'none' }}>Contact</a>
          </div>
        </nav>

        {/* Hero Section */}
        <header style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          textAlign: 'center',
          padding: '0 20px',
          transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 1s ease-out'
        }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: 72, 
            margin: 0, 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #fff, #f0f0f0)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 5px 15px rgba(0,0,0,0.3)',
            animation: 'slideInUp 1s ease-out 0.5s both'
          }}>
            Perpetuals Exchange
          </h1>
          <div style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 28, 
            marginTop: 20,
            maxWidth: 600,
            lineHeight: 1.4,
            animation: 'slideInUp 1s ease-out 0.7s both'
          }}>
            Trade crypto perpetuals with zero limits. <br/>
            <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Decentralized. Secure. Lightning Fast.</span>
          </div>
          
          <div style={{ 
            marginTop: 50,
            animation: 'slideInUp 1s ease-out 0.9s both'
          }}>
            <button 
              onClick={() => document.getElementById('app').scrollIntoView({ behavior: 'smooth' })}
              className="cta-button"
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                padding: '20px 40px',
                fontSize: 20,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: 'glow 2s ease-in-out infinite alternate',
                marginRight: 20
              }}
            >
              🚀 Start Trading Now
            </button>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 50,
                padding: '18px 35px',
                fontSize: 18,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              Learn More
            </button>
          </div>
        </header>
      </div>

      {/* Features Section */}
      <section id="features" style={{ 
        padding: '100px 20px', 
        background: 'linear-gradient(180deg, #f8f9ff 0%, #e8eeff 100%)',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: 48, 
          color: '#333', 
          marginBottom: 20,
          fontWeight: 'bold'
        }}>
          Why Choose PerpX?
        </h2>
        <p style={{ fontSize: 20, color: '#666', marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' }}>
          Experience the future of decentralized trading with cutting-edge technology
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 40, 
          maxWidth: 1200, 
          margin: '0 auto' 
        }}>
          {[
            { icon: '🔒', title: 'Non-Custodial', desc: 'Your funds, your keys. Complete control always.' },
            { icon: '⚡', title: 'Lightning Fast', desc: 'Execute trades in milliseconds with optimal performance.' },
            { icon: '🌐', title: 'Fully Decentralized', desc: 'No intermediaries. Pure peer-to-peer trading.' },
            { icon: '💎', title: 'Low Fees', desc: 'Minimal trading costs. Maximum profit potential.' },
            { icon: '🛡️', title: 'Secure & Audited', desc: 'Battle-tested smart contracts for peace of mind.' },
            { icon: '📱', title: 'Mobile Optimized', desc: 'Trade anywhere, anytime from any device.' }
          ].map((feature, i) => (
            <div 
              key={i}
              className="feature-card"
              style={{
                background: '#fff',
                padding: 40,
                borderRadius: 20,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                animation: `slideInUp 0.6s ease-out ${i * 0.1}s both`
              }}
            >
              <div style={{ fontSize: 60, marginBottom: 20 }}>{feature.icon}</div>
              <h3 style={{ fontSize: 24, color: '#333', marginBottom: 15, fontWeight: 'bold' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* App Section */}
      <section id="app" style={{ 
        padding: '100px 20px', 
        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          fontSize: 48, 
          color: '#fff', 
          marginBottom: 20,
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Ready to Trade?
        </h2>
        <p style={{ 
          fontSize: 20, 
          color: 'rgba(255,255,255,0.8)', 
          marginBottom: 50,
          textAlign: 'center',
          maxWidth: 600
        }}>
          Connect your wallet and start trading perpetuals in seconds
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          borderRadius: 24, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
          padding: 40, 
          minWidth: 400,
          maxWidth: 500,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          <PerpsDapp />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ 
        background: '#1a1a1a', 
        color: '#fff', 
        padding: '60px 20px 30px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 32, marginBottom: 20, fontWeight: 'bold' }}>⚡ PerpX</h3>
          <p style={{ fontSize: 16, color: '#ccc', maxWidth: 400, margin: '0 auto' }}>
            The future of decentralized perpetual trading is here. Join thousands of traders already using PerpX.
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 40, 
          marginBottom: 40,
          flexWrap: 'wrap'
        }}>
          <a href="https://docs.perptrade.app" style={{ color: '#667eea', textDecoration: 'none', fontSize: 18 }}>Documentation</a>
          <a href="https://github.com/perptrade" style={{ color: '#667eea', textDecoration: 'none', fontSize: 18 }}>GitHub</a>
          <a href="https://discord.gg/perptrade" style={{ color: '#667eea', textDecoration: 'none', fontSize: 18 }}>Discord</a>
          <a href="https://twitter.com/perptrade" style={{ color: '#667eea', textDecoration: 'none', fontSize: 18 }}>Twitter</a>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #333', 
          paddingTop: 30, 
          fontSize: 14, 
          color: '#888' 
        }}>
          &copy; {new Date().getFullYear()} PerpX. All rights reserved. Built with ❤️ for the DeFi community.
        </div>
      </footer>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
