import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

// Intercept all fetch calls and route relative /api calls to the live backend when on mobile
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = input;
  if (typeof url === 'string' && url.startsWith('/api') && Capacitor.isNativePlatform()) {
    url = 'https://studyos-snowy.vercel.app' + url;
  }
  return originalFetch(url, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
