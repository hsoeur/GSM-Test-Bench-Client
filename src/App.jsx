import './App.css'
import Product from './components/Product.jsx'
import ApiStatusFooter from './components/ApiStatusFooter.jsx'
import logo from './assets/logo.jpg'
import { ENDPOINTS } from './config/apiConfig'
import { checkGsmHealth, checkDataHealth } from './services/healthService'

function App() {
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
      <ApiStatusFooter
        endpoints={[
          { id: 'data', label: 'API DATA', url: ENDPOINTS.dataHealth, parse: undefined, check: checkDataHealth, subIndicators: [
            { key: 'database', label: 'Base' },
          ] },
          { id: 'test', label: 'API TEST GSM', check: checkGsmHealth, subIndicators: [
            { key: 'portOpen', label: 'Port' },
            { key: 'modemOk', label: 'Modem' },
          ] },
        ]}
        pollIntervalMs={10000}
        timeoutMs={4000}
      />
    </div>
  )
}

export default App
