import './App.css'
import Product from './components/Product.jsx'
import ApiStatusFooter from './components/ApiStatusFooter.jsx'
import ImpactMessage from './components/ImpactMessage.jsx'
import logo from './assets/logo.jpg'
import { getApiStatusConfig } from './config/runtimeConfig.js'
import { checkGsmHealth, checkDataHealth } from './services/healthService'
import { useEffect, useMemo, useRef, useState } from 'react'
import { initGsm } from './services/gsmService'
import OperatorAuth from './components/OperatorAuth.jsx'
import { useOperator } from './context/useOperator.js'
import ManufacturingOrderScanner from './components/ManufacturingOrderScanner.jsx'
import OperationSelector from './components/OperationSelector.jsx'
import SimAssignment from './components/SimAssignment.jsx'

function readStorageJson(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    void error
    return null
  }
}

function App() {
  const { operator, login, logout } = useOperator()
  const [mo, setMo] = useState(() => readStorageJson('ui-test-gsm:selectedMO')) // { uid, data }
  const [operation, setOperation] = useState(() => readStorageJson('ui-test-gsm:selectedOP'))
  const [simAssignments, setSimAssignments] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem('ui-test-gsm:simAssignments')
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      void error
      return null
    }
  })
  const [gsmInitState, setGsmInitState] = useState('idle') // idle | pending | success | error
  const [gsmInitError, setGsmInitError] = useState(null)
  const [showGsmInitSuccess, setShowGsmInitSuccess] = useState(false)
  const didInitRef = useRef(false)
  const initLockRef = useRef(false)
  const apiStatusConfig = useMemo(() => getApiStatusConfig(), [])

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
        setShowGsmInitSuccess(true)
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
  }, []) 

  // Auto-hide the success banner after 2 seconds, but keep app enabled
  useEffect(() => {
    if (gsmInitState === 'success' && showGsmInitSuccess) {
      const t = setTimeout(() => setShowGsmInitSuccess(false), 2000)
      return () => clearTimeout(t)
    }
  }, [gsmInitState, showGsmInitSuccess])

  useEffect(() => {
    try {
      if (mo) window.localStorage.setItem('ui-test-gsm:selectedMO', JSON.stringify(mo))
      else window.localStorage.removeItem('ui-test-gsm:selectedMO')
    } catch (error) {
      void error
    }
  }, [mo])

  useEffect(() => {
    try {
      if (operation) window.localStorage.setItem('ui-test-gsm:selectedOP', JSON.stringify(operation))
      else window.localStorage.removeItem('ui-test-gsm:selectedOP')
    } catch (error) {
      void error
    }
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

  const handleSimAssignmentConfirm = (assignments) => {
    setSimAssignments(assignments)
    try {
      window.sessionStorage.setItem('ui-test-gsm:simAssignments', JSON.stringify(assignments))
    } catch (error) {
      void error
    }
  }

  const handleChangeSimAssignments = () => {
    setSimAssignments(null)
    try {
      window.sessionStorage.removeItem('ui-test-gsm:simAssignments')
    } catch (error) {
      void error
    }
  }

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
                {simAssignments && (
                  <button className="btn-ghost" type="button" onClick={handleChangeSimAssignments}>Changer SIM</button>
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
      ) : !simAssignments ? (
        <div className="center-screen">
          <SimAssignment onConfirm={handleSimAssignmentConfirm} />
        </div>
      ) : (
        <>
      {gsmInitState !== 'idle' && (
        gsmInitState === 'success' && showGsmInitSuccess ? (
          <div style={{ padding: '12px 16px' }}>
            <ImpactMessage
              variant="success"
              title="Modem GSM initialisé"
              dismissible
              onClose={() => setShowGsmInitSuccess(false)}
            >
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
          <Product 
            key="productA" 
            productLabel="Product A" 
            simSelectId="simSelectA" 
            assignedSimCardNumber={simAssignments?.simA}
            currentOperationNumber={operation?.operationNumber}
            productUid={mo?.data?.productUid}
            manufacturingOrderUid={mo?.uid}
          />
          <Product 
            key="productB" 
            productLabel="Product B" 
            simSelectId="simSelectB" 
            assignedSimCardNumber={simAssignments?.simB}
            currentOperationNumber={operation?.operationNumber}
            productUid={mo?.data?.productUid}
            manufacturingOrderUid={mo?.uid}
          />
        </main>
        {gsmInitState !== 'success' && (
          <div className="shape-overlay">
            <div className="shape-overlay-text">
              Modem GSM non initialisé — veuillez initialiser le modem pour démarrer les tests.
            </div>
          </div>
        )}
      </div>
      <ApiStatusFooter
        endpoints={endpoints}
        pollIntervalMs={apiStatusConfig.pollIntervalMs}
        timeoutMs={apiStatusConfig.timeoutMs}
        debug={apiStatusConfig.debug}
      />
        </>
      )}
    </div>
  )
}

export default App
