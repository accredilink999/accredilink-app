import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/utils/toastSounds'
// Register PWA install listener globally (must load before beforeinstallprompt fires)
import '@/hooks/usePWAInstall'

// Global fix: scroll focused inputs into view above keyboard on mobile
document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
