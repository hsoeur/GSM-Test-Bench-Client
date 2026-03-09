import { useState, useMemo, useEffect, useRef } from 'react'
import TestStep from './TestStep.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { callGsm, hangupGsm } from '../services/gsmService.js'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { hasPreviousOperationOkStatus, createProductTraceability } from '../services/productTraceabilityService.js'
import { useOperator } from '../context/OperatorContext.jsx'
import { getSimCards, toSimOption } from '../services/simCardService.js'
import testSequenceConfig from '../config/testSequence.json'

function Product({ productLabel, simSelectId, currentOperationNumber }) {
  const { operator } = useOperator()
  
  const STATUS_UID = useMemo(() => ({
    OK: import.meta.env.VITE_PRODUCT_STATUS_OK_UID || 'OK',
    KO: import.meta.env.VITE_PRODUCT_STATUS_KO_UID || 'KO',
  }), [])

  // Test sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [testData, setTestData] = useState({
    labelScan: '',
    ofUid: '',
    serialLabel: '',
    productUid: '',
    selectedSim: '',
    simOptions: [],
    simList: [],
    isReady: null,
    phonieResult: null,
    batteryResult: null,
    testStartTs: null,
    gsmCallStatus: 'idle', // idle | calling | connected | error
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const didSubmitRef = useRef(false)

  const steps = useMemo(() => testSequenceConfig.testSequence || [], [])
  const currentStep = steps[currentStepIndex] || null

  // Load SIM cards on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { ok, status, data } = await getSimCards(5000)
        if (!ok) {
          setError(`Échec de récupération des SIM (HTTP ${status || '—'})`)
          if (!cancelled) {
            setTestData(prev => ({ ...prev, simOptions: [], simList: [] }))
          }
        } else {
          const list = Array.isArray(data) ? data : []
          const opts = list.map(toSimOption)
          if (!cancelled) {
            setTestData(prev => ({ ...prev, simOptions: opts, simList: list }))
          }
        }
      } catch (e) {
        setError("Impossible de récupérer la liste des cartes SIM.")
        if (!cancelled) {
          setTestData(prev => ({ ...prev, simOptions: [], simList: [] }))
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Restore last selected SIM from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sim:last:${simSelectId}`) || ''
      if (saved) {
        setTestData(prev => ({ ...prev, selectedSim: saved }))
      }
    } catch (e) {
      // ignore
    }
  }, [simSelectId])

  const selectedSimPhone = useMemo(() => {
    const { selectedSim, simList } = testData
    if (!selectedSim) return ''
    const sim = simList.find((s) => String(s?.simCardUid || '') === String(selectedSim))
    return String(sim?.phoneNumber || '')
  }, [testData])

  const resetAll = () => {
    didSubmitRef.current = false
    setCurrentStepIndex(0)
    setTestData(prev => ({
      labelScan: '',
      ofUid: '',
      serialLabel: '',
      productUid: '',
      selectedSim: '',
      simOptions: prev.simOptions,
      simList: prev.simList,
      isReady: null,
      phonieResult: null,
      batteryResult: null,
      testStartTs: null,
      gsmCallStatus: 'idle',
    }))
    setError('')
    setLoading(false)
  }

  const submitTraceability = async (status) => {
    try {
      const machineUid = import.meta.env.VITE_MACHINE_UID || 'MO03A'
      const manufacturingOrderUid = testData.ofUid || (localStorage.getItem('current:manufacturingOrderUid') || '')
      const statusUid = status === 'OK' ? STATUS_UID.OK : STATUS_UID.KO
      const payload = {
        productUid: String(testData.productUid || localStorage.getItem('current:productUid') || ''),
        productSerialNumber: String(testData.serialLabel || localStorage.getItem('current:serialNumber') || ''),
        productStatusUid: String(statusUid || ''),
        creationDate: new Date().toISOString(),
        manufacturingOrderUid: String(manufacturingOrderUid || ''),
        userUid: operator ? String(operator.userUid) : '',
        cycleTime: (() => {
          if (!testData.testStartTs) return ''
          const secs = (Date.now() - testData.testStartTs) / 1000
          return String(Number(secs.toFixed(1)))
        })(),
        operationNumber: currentOperationNumber != null ? String(currentOperationNumber) : '',
        machineUid: String(machineUid),
      }
      if (payload.productUid && payload.productSerialNumber && payload.manufacturingOrderUid) {
        await createProductTraceability(payload)
      }
    } catch (_) {
      // Ignore errors to avoid blocking UI
    }
  }

  const handleStepNext = async (stepId, value) => {
    setError('')
    setLoading(true)

    try {
      switch (stepId) {
        case 'scan-label': {
          // Parse label and fetch MO
          const raw = String(value)
          const parts = raw.split(';').map((p) => p.trim())
          const serialPart = parts[1] || ''
          const ofPart = parts[2] || ''

          setTestData(prev => ({
            ...prev,
            labelScan: raw,
            serialLabel: serialPart,
            ofUid: ofPart,
            testStartTs: Date.now(),
          }))

          // Persist context
          try {
            localStorage.setItem('current:manufacturingOrderUid', ofPart)
            localStorage.setItem('current:serialNumber', serialPart)
          } catch {}

          const { ok, data, status } = await getManufacturingOrderByUid(ofPart)
          if (!ok || !data) {
            setError(`Échec récupération OF (${status})`)
            return
          }

          const productUid = String(data.productUid || '')
          setTestData(prev => ({ ...prev, productUid }))
          
          try {
            localStorage.setItem('current:productUid', productUid)
          } catch {}

          // Check previous operation status
          const { ok: ok2, status: st2, value: prevOk, message } = await hasPreviousOperationOkStatus(
            productUid,
            serialPart,
            currentOperationNumber,
          )

          if (!ok2) {
            const serverMsg = (message || '').trim()
            if (serverMsg) {
              setError(serverMsg)
            } else if (st2 === 404) {
              setError("Aucune traçabilité trouvée pour l'opération précédente.")
            } else {
              setError(`Échec vérification étape précédente (${st2})`)
            }
            return
          }

          if (!prevOk) {
            setError("Produit non valide à l'étape de fabrication précédente.")
            return
          }

          // Move to next step
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'select-sim': {
          setTestData(prev => ({ ...prev, selectedSim: value }))
          try {
            localStorage.setItem(`sim:last:${simSelectId}`, value)
          } catch {}
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'insert-sim': {
          // Opérateur a inséré la SIM et mis le produit sous tension
          // Passer à l'étape suivante
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'check-init': {
          if (value === 'ko') {
            setTestData(prev => ({ ...prev, isReady: false }))
            await submitTraceability('KO')
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          setTestData(prev => ({ ...prev, isReady: true, gsmCallStatus: 'calling' }))

          // Initiate GSM call
          const phone = selectedSimPhone
          if (!phone) {
            setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
            setError('Aucun numéro associé à la carte SIM sélectionnée.')
            return
          }

          try {
            const { ok, status } = await callGsm({ phoneNumber: phone, audioOk: true })
            if (!ok) {
              setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
              setError(`Échec de l'appel (HTTP ${status || '—'})`)
              return
            }
            // Appel réussi
            setTestData(prev => ({ ...prev, gsmCallStatus: 'connected' }))
          } catch {
            setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
            setError("Impossible d'initier l'appel via le modem GSM.")
            return
          }

          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'test-phonie': {
          // Hangup call
          try {
            await hangupGsm()
            setTestData(prev => ({ ...prev, gsmCallStatus: 'idle' }))
          } catch {}

          if (value === 'ko') {
            setTestData(prev => ({ ...prev, phonieResult: 'ko' }))
            await submitTraceability('KO')
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          setTestData(prev => ({ ...prev, phonieResult: 'ok' }))
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'test-battery': {
          if (value === 'ko') {
            setTestData(prev => ({ ...prev, batteryResult: 'ko' }))
            await submitTraceability('KO')
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          setTestData(prev => ({ ...prev, batteryResult: 'ok' }))
          await submitTraceability('OK')
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'test-complete': {
          resetAll()
          break
        }

        default:
          setCurrentStepIndex(prev => prev + 1)
      }
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  const isBad = testData.isReady === false || testData.phonieResult === 'ko' || testData.batteryResult === 'ko'
  const isGood = testData.batteryResult === 'ok'

  return (
    <div className={`panel ${isGood ? 'good' : (isBad ? 'bad' : '')}`}>
      <div className="panel-header">
        <h2>{productLabel}</h2>
        {testData.serialLabel && (
          <span className="panel-subtitle">Code en test: {testData.serialLabel}</span>
        )}
      </div>
      
      <div className="panel-body">
        {error && (
          <ImpactMessage
            variant="error"
            title="Erreur"
            actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
          >
            {error}
          </ImpactMessage>
        )}

        {!error && currentStep && (
          <TestStep
            step={currentStep}
            data={testData}
            onNext={handleStepNext}
            onError={(err) => setError(String(err?.message || err))}
          />
        )}
      </div>
    </div>
  )
}

export default Product
