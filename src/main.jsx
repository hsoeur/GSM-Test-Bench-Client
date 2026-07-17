import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { OperatorProvider } from './context/OperatorContext.jsx'
import { loadRuntimeConfig } from './config/runtimeConfig.js'

const root = createRoot(document.getElementById('root'))

try {
  await loadRuntimeConfig()
  const { default: App } = await import('./App.jsx')

  root.render(
    <StrictMode>
      <OperatorProvider>
        <App />
      </OperatorProvider>
    </StrictMode>,
  )
} catch (error) {
  const errors = Array.isArray(error?.errors) ? error.errors : [String(error?.message || error)]
  root.render(
    <StrictMode>
      <div className="config-error-screen">
        <div className="config-error-panel">
          <h1>Configuration runtime invalide</h1>
          <p>L’application ne peut pas démarrer tant que la configuration de production n’est pas corrigée.</p>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </StrictMode>,
  )
}
