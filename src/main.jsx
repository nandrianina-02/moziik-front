import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import InstallPWA from './components/FloatingInstallButton.jsx';

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nouvelle version disponible. Recharger ?')) {
      updateSW(true)
    }
  },
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InstallPWA />
    <App />
  </React.StrictMode>,
)