import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { OperatorProvider } from './context/OperatorContext.jsx'
import { loadRuntimeConfig } from './config/runtimeConfig.js'

await loadRuntimeConfig()
const { default: App } = await import('./App.jsx')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OperatorProvider>
      <App />
    </OperatorProvider>
  </StrictMode>,
)
