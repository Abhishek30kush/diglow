import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Inject Google Search Console verification meta tag if provided via environment
if (typeof document !== 'undefined' && import.meta.env.VITE_GSC_VERIFICATION) {
  const gscMeta = document.createElement('meta');
  gscMeta.name = 'google-site-verification';
  gscMeta.content = import.meta.env.VITE_GSC_VERIFICATION;
  document.head.appendChild(gscMeta);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
