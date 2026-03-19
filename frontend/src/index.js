import React from 'react';
import ReactDOM from 'react-dom/client';
// Bootswatch theme is loaded from CDN to avoid local sourcemap resolution issues
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals removed — not needed for this project
