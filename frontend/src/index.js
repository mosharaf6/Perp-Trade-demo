import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { CONFIG } from './config/constants';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
if (CONFIG.IS_PRODUCTION) {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}

// Performance monitoring
reportWebVitals(CONFIG.IS_DEVELOPMENT ? console.log : undefined);
