import './App.css'
import Product from './components/Product.jsx'
import ApiStatusFooter from './components/ApiStatusFooter.jsx'
import logo from './assets/logo.jpg'
import { ENDPOINTS } from './config/apiConfig'
import { checkGsmHealth, checkDataHealth } from './services/healthService'
import { useMemo } from 'react'

function App() {
  const endpoints = useMemo(() => ([
    { id: 'data', label: 'Api Data', check: checkDataHealth, subIndicators: [
      { key: 'database', label: 'MySQL' },
    ] },
    { id: 'test', label: 'Api Test Gsm', check: checkGsmHealth, subIndicators: [
      { key: 'portOpen', label: 'COM' },
      { key: 'modemOk', label: 'Modem Gsm' },
    ] },
  ]), [])

  return (
    <div className="app">
      <header className="brand-header">
        <div className="brand-bar">
          <img src={logo} alt="Test GSM" className="brand-logo" />
          <div className="brand-name">Test GSM</div>
        </div>
      </header>
      <main className="split-view">
        <Product productLabel="Product A" simSelectId="simSelectA" />
        <Product productLabel="Product B" simSelectId="simSelectB" />
      </main>
      <ApiStatusFooter endpoints={endpoints} pollIntervalMs={10000} timeoutMs={4000} />
    </div>
  )
}

export default App
