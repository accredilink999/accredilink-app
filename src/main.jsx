import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/utils/toastSounds'
// Register PWA install listener globally (must load before beforeinstallprompt fires)
import '@/hooks/usePWAInstall'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
