import './App.css'
import Product from './components/Product.jsx'
import ApiStatusFooter from './components/ApiStatusFooter.jsx'
import ImpactMessage from './components/ImpactMessage.jsx'
import logo from './assets/logo.jpg'
import { ENDPOINTS } from './config/apiConfig'
import { checkGsmHealth, checkDataHealth } from './services/healthService'
import { useEffect, useMemo, useRef, useState } from 'react'
import { initGsm } from './services/gsmService'

function App() {
  const [gsmInitState, setGsmInitState] = useState('idle') // idle | pending | success | error
  const [gsmInitError, setGsmInitError] = useState(null)
  const didInitRef = useRef(false)
  const initLockRef = useRef(false)

  const handleInitGsm = async () => {
    // Prevent overlapping calls (e.g., React StrictMode double-invoke, rapid clicks)
    if (initLockRef.current) return
    initLockRef.current = true
    try {
      setGsmInitState('pending')
      setGsmInitError(null)
      const res = await initGsm(4000)
      if (res.ok) {
        setGsmInitState('success')
      } else {
        setGsmInitState('error')
        setGsmInitError(`Initialisation du modem GSM échouée (HTTP ${res.status || '—'})`)
      }
    } finally {
      initLockRef.current = false
    }
  }

  useEffect(() => {
    // Run once even under React StrictMode (which double-invokes).
    if (!didInitRef.current) {
      didInitRef.current = true
      handleInitGsm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      {gsmInitState !== 'idle' && (
        gsmInitState === 'success' ? (
          <div style={{ padding: '12px 16px' }}>
            <ImpactMessage variant="success" title="Modem GSM initialisé">
              L'initialisation du modem GSM s'est bien passée.
            </ImpactMessage>
          </div>
        ) : gsmInitState === 'error' ? (
          <div style={{ padding: '12px 16px' }}>
            <ImpactMessage
              variant="error"
              title="Erreur lors de l'initialisation du modem GSM"
              actions={(
                <button className="btn" type="button" onClick={handleInitGsm} disabled={gsmInitState === 'pending'}>
                  Réessayer
                </button>
              )}
            >
              {gsmInitError || "Une erreur est survenue lors de l'appel d'initialisation."}
            </ImpactMessage>
          </div>
        ) : null
      )}
      <div className="shape-container">
        <main className={`split-view ${gsmInitState === 'success' ? '' : 'disabled'}`}>
          <Product productLabel="Product A" simSelectId="simSelectA" />
          <Product productLabel="Product B" simSelectId="simSelectB" />
        </main>
        {gsmInitState !== 'success' && (
          <div className="shape-overlay">
            <div className="shape-overlay-text">
              Modem GSM non initialisé — veuillez initialiser le modem pour démarrer les tests.
            </div>
          </div>
        )}
      </div>
      <ApiStatusFooter endpoints={endpoints} pollIntervalMs={10000} timeoutMs={4000} />
    </div>
  )
}

export default App
