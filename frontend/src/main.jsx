import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './assets/app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem' },
        success: { style: { background: '#14532d', color: '#f1f5f9', borderLeft: '3px solid #4ade80' } },
        error:   { style: { background: '#450a0a', color: '#f1f5f9', borderLeft: '3px solid #f87171' } },
      }}
    />
  </React.StrictMode>
)
