import { useState, useMemo, useEffect } from 'react'
import ProgressBar from './ProgressBar.jsx'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import ShapeDisplay from './ShapeDisplay.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { callGsm, hangupGsm } from '../services/gsmService.js'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { hasPreviousOperationOkStatus, createProductTraceability } from '../services/productTraceabilityService.js'
import { useOperator } from '../context/OperatorContext.jsx'

function Product({ productLabel, simSelectId, currentOperationNumber }) {
  const { operator } = useOperator()
  // Manufacturing order context
  const [labelScan, setLabelScan] = useState('')
  const [ofUid, setOfUid] = useState('')
  const [serialLabel, setSerialLabel] = useState('')
  const [productUid, setProductUid] = useState('')
  const [moLoading, setMoLoading] = useState(false)
  const [moError, setMoError] = useState('')
  const [prevOpOk, setPrevOpOk] = useState(null) // boolean | null
  const [testStartTs, setTestStartTs] = useState(null)

  const [serial, setSerial] = useState('')
  const [showSimSelect, setShowSimSelect] = useState(false)
  const [selectedSim, setSelectedSim] = useState('')
  const [isReady, setIsReady] = useState(null)
  const [phonieResult, setPhonieResult] = useState(null) // 'ok' | 'ko' | null
  const [batteryResult, setBatteryResult] = useState(null) // 'ok' | 'ko' | null
  const [callStatus, setCallStatus] = useState('idle') // idle | pending | success | error
  const [callError, setCallError] = useState('')

  const simStorageKey = useMemo(() => `sim:last:${simSelectId}`,[simSelectId])

  // Validate label like "0505F ;100002;30000;71;07/01/2026"
  const validateLabel = useMemo(() => {
    return (v) => {
      const parts = String(v).split(';').map((p) => p.trim()).filter(Boolean)
      return parts.length >= 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])
    }
  }, [])

  const simOptions = useMemo(
    () => [
      { value: 'SIM-01', label: 'SIM 01 — Orange' },
      { value: 'SIM-02', label: 'SIM 02 — SFR' },
      { value: 'SIM-03', label: 'SIM 03 — Bouygues' },
      { value: 'SIM-04', label: 'SIM 04 — Free' },
    ],
    [],
  )

  // Parse label and fetch Manufacturing Order details
  const onLabelValid = async (value) => {
    const raw = String(value)
    setLabelScan(raw)
    const parts = raw.split(';').map((p) => p.trim())
    const serialPart = parts[1] || ''
    const ofPart = parts[2] || ''
    setSerialLabel(serialPart)
    setOfUid(ofPart)
    // Use label SN as the working serial; gate next steps until traceability ok
    setSerial(serialPart.toUpperCase())
    setShowSimSelect(false)
    try {
      const saved = localStorage.getItem(simStorageKey) || ''
      setSelectedSim(saved)
    } catch (e) {
      setSelectedSim('')
    }
    setIsReady(null)
    setPhonieResult(null)
    setBatteryResult(null)
    setTestStartTs(Date.now())
    setMoError('')
    setMoLoading(true)
    try {
      const { ok, data, status } = await getManufacturingOrderByUid(ofPart)
      if (!ok || !data) {
        setMoError(`Échec récupération OF (${status})`)
        setProductUid('')
        setPrevOpOk(null)
      } else {
        setProductUid(String(data.productUid || ''))
        // Persist minimal context
        try {
          localStorage.setItem('current:manufacturingOrderUid', String(data.manufacturingOrderUid || ofPart))
          localStorage.setItem('current:productUid', String(data.productUid || ''))
          localStorage.setItem('current:serialNumber', String(serialPart || ''))
        } catch {}

        // Check previous operation status using selected operation number (may be empty)
        const { ok: ok2, status: st2, value, message } = await hasPreviousOperationOkStatus(
          String(data.productUid || ''),
          String(serialPart || ''),
          currentOperationNumber,
        )
        if (!ok2) {
          const serverMsg = (message || '').trim()
          if (serverMsg) {
            setMoError(serverMsg)
          } else if (st2 === 404) {
            setMoError("Aucune traçabilité trouvée pour l'opération précédente.")
          } else {
            setMoError(`Échec vérification étape précédente (${st2})`)
          }
          setPrevOpOk(null)
        } else {
          setPrevOpOk(Boolean(value))
          // Allow progressing only when previous op is OK
          setShowSimSelect(Boolean(value))
        }
      }
    } catch (e) {
      setMoError(String(e?.message || e))
      setProductUid('')
      setPrevOpOk(null)
    } finally {
      setMoLoading(false)
    }
  }

  useEffect(() => {
    //eChanging SIM resets readiness and phonie result
    setIsReady(null)
    setPhonieResult(null)
    setBatteryResult(null)
  }, [selectedSim])

  useEffect(() => {
    // Changing phonie result resets battery step
    setBatteryResult(null)
  }, [phonieResult])

  useEffect(() => {
    // Persist SIM choice per product when selected
    try {
      if (selectedSim) localStorage.setItem(simStorageKey, selectedSim)
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedSim, simStorageKey])

  const resetAll = () => {
    setSerial('')
    setShowSimSelect(false)
    setSelectedSim('')
    setIsReady(null)
    setPhonieResult(null)
    setBatteryResult(null)
    setCallStatus('idle')
    setCallError('')
    setLabelScan('')
    setOfUid('')
    setSerialLabel('')
    setProductUid('')
    setMoError('')
    setPrevOpOk(null)
    setTestStartTs(null)
  }

  const submitAndReset = async (status) => {
    try {
      const machineUid = import.meta.env.VITE_MACHINE_UID || 'MO03A'
      const manufacturingOrderUid = ofUid || (localStorage.getItem('current:manufacturingOrderUid') || '')
      const payload = {
        productUid: String(productUid || localStorage.getItem('current:productUid') || ''),
        productSerialNumber: String(serial || localStorage.getItem('current:serialNumber') || ''),
        productStatusUid: String(status || ''),
        creationDate: new Date().toISOString(),
        manufacturingOrderUid: String(manufacturingOrderUid || ''),
        userUid: operator ? String(operator.userUid) : '',
        cycleTime: (() => {
          if (!testStartTs) return ''
          const secs = (Date.now() - testStartTs) / 1000
          return String(Number(secs.toFixed(1)))
        })(),
        operationNumber: currentOperationNumber != null ? String(currentOperationNumber) : '',
        machineUid: String(machineUid),
      }
      // Only submit if we have minimal required fields
      if (payload.productUid && payload.productSerialNumber && payload.manufacturingOrderUid) {
        await createProductTraceability(payload)
      }
    } catch (_) {
      // Swallow errors; proceed with reset as requested
    } finally {
      resetAll()
    }
  }

  const stepsTotal = 5
  const stepsDone = (
    (serial ? 1 : 0) +
    (selectedSim ? 1 : 0) +
    (isReady !== null ? 1 : 0) +
    (phonieResult !== null ? 1 : 0) +
    (batteryResult !== null ? 1 : 0)
  )
  const progressPct = Math.round((stepsDone / stepsTotal) * 100)
  console.log({ stepsDone, progressPct })


  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{productLabel}</h2>
        {serial && (
          <span className="panel-subtitle">Code en test: {serial}</span>
        )}
      </div>  
      <div className="panel-body">
            {/* Label scan for Manufacturing Order */}
            <KeyboardScanner
              title="Scanne Etiquette de Lot"
              showCaptureButton={false}
              validate={validateLabel}
              onValid={onLabelValid}
              invalidMessage="Étiquette invalide (format attendu avec points-virgules)"
              onScan={() => {}}
              showLastResult={false}
            />

            {(productUid || serialLabel || ofUid) && (
              <ImpactMessage
                variant={moError ? 'error' : 'info'}
                title={moError ? 'Vérification étape précédente' : 'Contexte OF en cours'}
                actions={(
                  <>
                    {moLoading ? (
                      <span>Chargement…</span>
                    ) : (
                      <button className="btn" onClick={resetAll}>Effacer</button>
                    )}
                  </>
                )}
              >
                {moError && (
                  <div style={{ marginBottom: 8 }}>
                    {moError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px' }}>
                  <span>Code produit:</span>
                  <strong>{productUid || '—'}</strong>
                  <span>SN:</span>
                  <strong>{serialLabel || '—'}</strong>
                  <span>Numéro d’OF:</span>
                  <strong>{ofUid || '—'}</strong>
                </div>
              </ImpactMessage>
            )}

            {prevOpOk === true && (
              <ImpactMessage variant="success" title="Produit OK N-1">
                Étape précédente validée. Vous pouvez continuer.
              </ImpactMessage>
            )}

            {prevOpOk === false && (
              <ImpactMessage
                variant="error"
                title="Produit non valide"
                actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
              >
                Produit non valide à l’étape de fabrication précédente.
              </ImpactMessage>
            )}

            <div style={{ marginBottom: 12 }}>
              <ProgressBar value={progressPct} label={`Avancement du test: ${progressPct}%`} />
            </div>

            {prevOpOk === true && showSimSelect && (
              <SimSelector
                id={simSelectId}
                options={simOptions}
                value={selectedSim}
                onChange={setSelectedSim}
              />
            )}

            <ShapeDisplay
              serial={serial}
              sim={selectedSim}
              ready={isReady === true}
              shape={
                batteryResult === 'ok'
                  ? 'green'
                  : batteryResult === 'ko'
                  ? 'red'
                  : phonieResult === 'ko'
                  ? 'red'
                  : null
              }
            />

            {prevOpOk === true && selectedSim && isReady === null && (
              <ImpactMessage
                variant="info"
                title="Confirmez l’état READY"
                actions={(
                  <>
                    <button
                      className="btn"
                      onClick={() => {
                        // Proceed immediately without awaiting the endpoint
                        setIsReady(true)
                        // Fire-and-forget the call; update status when it returns
                        if (callStatus !== 'pending') {
                          setCallStatus('pending')
                          setCallError('')
                          callGsm({ phoneNumber: '+33619228309', audioOk: true })
                            .then(({ ok, status }) => {
                              if (ok) setCallStatus('success')
                              else {
                                setCallStatus('error')
                                setCallError(`Échec de l'appel (HTTP ${status || '—'})`)
                              }
                            })
                            .catch(() => {
                              setCallStatus('error')
                              setCallError("Impossible d'initier l'appel via le modem GSM.")
                            })
                        }
                      }}
                    >
                      Oui
                    </button>
                    <button className="btn" onClick={() => setIsReady(false)}>Non</button>
                  </>
                )}
              >
                Le produit est-il en mode READY (bien initialisé) ?
              </ImpactMessage>
            )}

            {prevOpOk === true && selectedSim && isReady === false && (
              <ImpactMessage
                variant="error"
                title="Initialisation incomplète"
                actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
              >
                Le produit n'est pas bien initialisé.
              </ImpactMessage>
            )}

            {prevOpOk === true && callStatus === 'error' && (
              <ImpactMessage
                variant="error"
                title="Échec de démarrage de l'appel"
                actions={(
                  <>
                    <button
                      className="btn"
                      disabled={callStatus === 'pending'}
                      onClick={async () => {
                        if (callStatus === 'pending') return
                        setCallStatus('pending')
                        setCallError('')
                        const { ok, status } = await callGsm({ phoneNumber: '+33619228309', audioOk: true })
                        if (ok) {
                          setCallStatus('success')
                          setIsReady(true)
                        } else {
                          setCallStatus('error')
                          setCallError(`Échec de l'appel (HTTP ${status || '—'})`)
                        }
                      }}
                    >
                      Réessayer l'appel
                    </button>
                  </>
                )}
              >
                {callError || "Impossible d'initier l'appel via le modem GSM."}
              </ImpactMessage>
            )}

            {prevOpOk === true && callStatus === 'success' && phonieResult === null && (
              <ImpactMessage variant="info" title="Appel lancé">
                L'appel a été initié. Procédez au test de phonie puis sélectionnez le résultat.
              </ImpactMessage>
            )}

            {prevOpOk === true && selectedSim && isReady === true && phonieResult === null && (
              <ImpactMessage
                variant="info"
                title="Tester la Phonie"
                actions={(
                  <>
                    <button
                      className="btn"
                      onClick={() => {
                        setPhonieResult('ok')
                        // Fire-and-forget hangup request; do not block UI
                        hangupGsm().catch(() => {})
                      }}
                    >
                      Phonie OK
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setPhonieResult('ko')
                        // Fire-and-forget hangup request; do not block UI
                        hangupGsm().catch(() => {})
                      }}
                    >
                      Phonie KO
                    </button>
                  </>
                )}
              >
                Effectuez le test de Phonie et sélectionnez le résultat.
              </ImpactMessage>
            )}

            {prevOpOk === true && phonieResult && (
              phonieResult === 'ok' ? (
                <ImpactMessage variant="success" title="Phonie réussie">Phonie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Phonie échouée">Échec du test</ImpactMessage>
              )
            )}

            {prevOpOk === true && phonieResult === 'ko' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setPhonieResult(null)}>Retester ce produit</button>
                <button className="btn" onClick={() => submitAndReset('KO')}>Tester un autre produit</button>
              </div>
            )}

            {prevOpOk === true && selectedSim && isReady === true && phonieResult === 'ok' && batteryResult === null && (
              <ImpactMessage
                variant="warning"
                title="Vérifier la LED en mode batterie"
                actions={(
                  <>
                    <button className="btn" onClick={() => setBatteryResult('ok')}>Bascule: OK</button>
                    <button className="btn" onClick={() => setBatteryResult('ko')}>Bascule: KO</button>
                  </>
                )}
              >
                Basculez sur la batterie et confirmez si la LED s’allume.
              </ImpactMessage>
            )}

            {prevOpOk === true && batteryResult && (
              batteryResult === 'ok' ? (
                <ImpactMessage variant="success" title="Bascule batterie OK">Bascule batterie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Bascule batterie KO">Bascule batterie: Échec du test</ImpactMessage>
              )
            )}

            {prevOpOk === true && (batteryResult === 'ok' || batteryResult === 'ko') && (
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => submitAndReset(batteryResult === 'ok' ? 'OK' : 'KO')}>Tester un autre produit</button>
                
              </div>
            )}
      </div>
    </div>
  )
}

export default Product
