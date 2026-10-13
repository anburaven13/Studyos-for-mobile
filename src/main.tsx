import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'
import { setupGlobalFetchInterceptor } from './lib/api'
import App from './App.tsx'

// Intercept all relative '/api' calls immediately so Capacitor WebView routes to backend
setupGlobalFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
