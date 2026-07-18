import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { reportWebVitals } from '@/lib/performance'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './styles/globals.css'

const savedTheme = localStorage.getItem('theme') || 'system'
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else if (savedTheme === 'system') {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
}

reportWebVitals()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)