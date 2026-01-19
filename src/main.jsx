import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OperatorProvider } from './context/OperatorContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OperatorProvider>
      <App />
    </OperatorProvider>
  </StrictMode>,
)
