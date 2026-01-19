import './App.css'
import Product from './components/Product.jsx'
import ApiStatusFooter from './components/ApiStatusFooter.jsx'
import ImpactMessage from './components/ImpactMessage.jsx'
import logo from './assets/logo.jpg'
import { ENDPOINTS } from './config/apiConfig'
import { checkGsmHealth, checkDataHealth } from './services/healthService'
import { useEffect, useMemo, useRef, useState } from 'react'
import { initGsm } from './services/gsmService'
import OperatorAuth from './components/OperatorAuth.jsx'
import { useOperator } from './context/OperatorContext.jsx'
import ManufacturingOrderScanner from './components/ManufacturingOrderScanner.jsx'
import OperationSelector from './components/OperationSelector.jsx'

function App() {
  const { operator, login, logout } = useOperator()
  const [mo, setMo] = useState(null) // { uid, data }
  const [operation, setOperation] = useState(null)
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

  // Optional: persist MO in localStorage for convenience during a session
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ui-test-gsm:selectedMO')
      if (raw && !mo) setMo(JSON.parse(raw))
      const rawOp = window.localStorage.getItem('ui-test-gsm:selectedOP')
      if (rawOp && !operation) setOperation(JSON.parse(rawOp))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (mo) window.localStorage.setItem('ui-test-gsm:selectedMO', JSON.stringify(mo))
      else window.localStorage.removeItem('ui-test-gsm:selectedMO')
    } catch {}
  }, [mo])

  useEffect(() => {
    try {
      if (operation) window.localStorage.setItem('ui-test-gsm:selectedOP', JSON.stringify(operation))
      else window.localStorage.removeItem('ui-test-gsm:selectedOP')
    } catch {}
  }, [operation])

  const endpoints = useMemo(() => ([
    { id: 'data', label: 'Api Data', check: checkDataHealth, subIndicators: [
      { key: 'database', label: 'MySQL' },
    ] },
    { id: 'test', label: 'Api Test Gsm', check: checkGsmHealth, subIndicators: [
      { key: 'portOpen', label: 'COM' },
      { key: 'modemOk', label: 'Modem Gsm' },
    ] },
  ]), [])

  const handleAuthenticated = (op) => {
    setMo(null)
    setOperation(null)
    login(op)
  }

  const handleLogout = () => {
    setMo(null)
    setOperation(null)
    logout()
  }

  return (
    <div className="app">
      <header className="brand-header">
        <div className="brand-bar">
          <img src={logo} alt="Test GSM" className="brand-logo" />
          <div className="brand-name">Test GSM</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Opérateur: {operator ? `${operator.lastName} ${operator.firstName}` : '—'}
            </span>
            {operator && (
              <>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  OF: {mo ? (mo.data?.manufacturingOrderNumber || mo.uid) : '—'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Opération: {operation ? `${operation.operationNumber} — ${operation.label}` : '—'}
                </span>
                {mo && (
                  <button className="btn-ghost" type="button" onClick={() => setMo(null)}>Changer OF</button>
                )}
                {operation && (
                  <button className="btn-ghost" type="button" onClick={() => setOperation(null)}>Changer Opération</button>
                )}
              </>
            )}
            {operator && (
              <button className="btn-ghost" type="button" onClick={handleLogout}>Déconnexion</button>
            )}
          </div>
        </div>
      </header>
      {!operator ? (
        <div className="center-screen">
          <OperatorAuth onAuthenticated={handleAuthenticated} />
        </div>
      ) : !mo ? (
        <div className="center-screen">
          <ManufacturingOrderScanner onSelected={setMo} />
        </div>
      ) : !operation ? (
        <div className="center-screen">
          <OperationSelector productUid={mo?.data?.productUid} onSelected={setOperation} />
        </div>
      ) : (
        <>
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
          <Product productLabel="Product A" simSelectId="simSelectA" currentOperationNumber={operation?.operationNumber} />
          <Product productLabel="Product B" simSelectId="simSelectB" currentOperationNumber={operation?.operationNumber} />
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
        </>
      )}
    </div>
  )
}

export default App
