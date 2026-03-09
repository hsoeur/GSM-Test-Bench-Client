import { useState, useMemo, useEffect, useRef } from 'react'
import ProgressBar from './ProgressBar.jsx'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import ShapeDisplay from './ShapeDisplay.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { callGsm, hangupGsm } from '../services/gsmService.js'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { hasPreviousOperationOkStatus, createProductTraceability } from '../services/productTraceabilityService.js'
import { useOperator } from '../context/OperatorContext.jsx'
import { getSimCards, toSimOption } from '../services/simCardService.js'

function Product({ productLabel, simSelectId, currentOperationNumber }) {
  const { operator } = useOperator()
  const STATUS_UID = useMemo(() => ({
    OK: import.meta.env.VITE_PRODUCT_STATUS_OK_UID || 'OK',
    KO: import.meta.env.VITE_PRODUCT_STATUS_KO_UID || 'KO',
  }), [])
  // Manufacturing order context
  const [labelScan, setLabelScan] = useState('')
  const [ofUid, setOfUid] = useState('')
  const [serialLabel, setSerialLabel] = useState('')
  const [productUid, setProductUid] = useState('')
  const [moLoading, setMoLoading] = useState(false)
  const [moError, setMoError] = useState('')
  const [prevOpOk, setPrevOpOk] = useState(null) // boolean | null
  const [showPrevOpOkBanner, setShowPrevOpOkBanner] = useState(false)
  const [testStartTs, setTestStartTs] = useState(null)

  const [serial, setSerial] = useState('')
  const [showSimSelect, setShowSimSelect] = useState(false)
  const [selectedSim, setSelectedSim] = useState('')
  const [simOptions, setSimOptions] = useState([])
  const [simList, setSimList] = useState([])
  const [simError, setSimError] = useState('')
  const [isReady, setIsReady] = useState(null)
  const [phonieResult, setPhonieResult] = useState(null) // 'ok' | 'ko' | null
  const [batteryResult, setBatteryResult] = useState(null) // 'ok' | 'ko' | null
  const [callStatus, setCallStatus] = useState('idle') // idle | pending | success | error
  const [callError, setCallError] = useState('')
  const didSubmitRef = useRef(false)

  const simStorageKey = useMemo(() => `sim:last:${simSelectId}`,[simSelectId])

  // Validate label like "0505F ;100002;30000;71;07/01/2026"
  const validateLabel = useMemo(() => {
    return (v) => {
      const parts = String(v).split(';').map((p) => p.trim()).filter(Boolean)
      return parts.length >= 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])
    }
  }, [])

  // Fetch SIM cards once on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setSimError('')
        const { ok, status, data } = await getSimCards(5000)
        if (!ok) {
          setSimError(`Échec de récupération des SIM (HTTP ${status || '—'})`)
          if (!cancelled) {
            setSimOptions([])
            setSimList([])
          }
        } else {
          const list = Array.isArray(data) ? data : []
          const opts = list.map(toSimOption)
          if (!cancelled) {
            setSimOptions(opts)
            setSimList(list)
          }
        }
      } catch (e) {
        setSimError("Impossible de récupérer la liste des cartes SIM.")
        if (!cancelled) {
          setSimOptions([])
          setSimList([])
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const selectedSimPhone = useMemo(() => {
    if (!selectedSim) return ''
    const sim = simList.find((s) => String(s?.simCardUid || '') === String(selectedSim))
    return String(sim?.phoneNumber || '')
  }, [simList, selectedSim])

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
    // If a persisted SIM is not in the fetched list, clear it
    if (selectedSim && Array.isArray(simOptions) && simOptions.length > 0) {
      const exists = simOptions.some((o) => o?.value === selectedSim)
      if (!exists) setSelectedSim('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simOptions])

  useEffect(() => {
    // Changing phonie result resets battery step
    setBatteryResult(null)
  }, [phonieResult])

  // Auto-hide "Produit OK N-1" banner after 1 second
  useEffect(() => {
    if (prevOpOk === true) {
      setShowPrevOpOkBanner(true)
      const t = setTimeout(() => setShowPrevOpOkBanner(false), 1000)
      return () => clearTimeout(t)
    } else {
      setShowPrevOpOkBanner(false)
    }
  }, [prevOpOk])

  useEffect(() => {
    // Persist SIM choice per product when selected
    try {
      if (selectedSim) localStorage.setItem(simStorageKey, selectedSim)
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedSim, simStorageKey])

  const resetAll = () => {
    // Allow auto-submission on next card
    didSubmitRef.current = false
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
      const statusUid = status === 'OK' ? STATUS_UID.OK : STATUS_UID.KO
      const payload = {
        productUid: String(productUid || localStorage.getItem('current:productUid') || ''),
        productSerialNumber: String(serial || localStorage.getItem('current:serialNumber') || ''),
        productStatusUid: String(statusUid || ''),
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

  // Submit traceability without resetting UI; used for automatic finalization
  const submitTraceability = async (status) => {
    try {
      console.group('[Traceability] Submitting')
      console.info('Status:', status)
      const machineUid = import.meta.env.VITE_MACHINE_UID || 'MO03A'
      const manufacturingOrderUid = ofUid || (localStorage.getItem('current:manufacturingOrderUid') || '')
      const statusUid = status === 'OK' ? STATUS_UID.OK : STATUS_UID.KO
      const payload = {
        productUid: String(productUid || localStorage.getItem('current:productUid') || ''),
        productSerialNumber: String(serial || localStorage.getItem('current:serialNumber') || ''),
        productStatusUid: String(statusUid || ''),
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
      console.info('Payload:', payload)
      if (payload.productUid && payload.productSerialNumber && payload.manufacturingOrderUid) {
        const { ok, status } = await createProductTraceability(payload)
        console.info('Response:', { ok, status })
      } else {
        console.warn('Missing required fields; skipping traceability submit')
      }
    } catch (_) {
      // Ignore errors to avoid blocking UI
    } finally {
      console.groupEnd()
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

  // Derive explicit product status tones for strong visual feedback
  const isBad = (isReady === false) || (phonieResult === 'ko') || (batteryResult === 'ko')
  const isGood = (batteryResult === 'ok')

  // Auto-submit traceability once when final state is reached (good or bad)
  useEffect(() => {
    const finalStatus = isGood ? 'OK' : (isBad ? 'KO' : null)
    if (finalStatus && !didSubmitRef.current) {
      didSubmitRef.current = true
      submitTraceability(finalStatus)
    }
  }, [isGood, isBad])


  return (
    <div className={`panel ${isGood ? 'good' : (isBad ? 'bad' : '')}`}>
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

            {/* Removed OF context display after label scan per request */}

            {moError && (
              <ImpactMessage
                variant="error"
                title="Erreur de traçabilité"
                actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
              >
                {moError}
              </ImpactMessage>
            )}

            {prevOpOk === true && showPrevOpOkBanner && (
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

            {prevOpOk === true && showSimSelect && simError && (
              <ImpactMessage variant="error" title="Cartes SIM indisponibles">
                {simError}
              </ImpactMessage>
            )}

            <ShapeDisplay
              serial={serial}
              sim={selectedSim}
              ready={isReady === true}
              overlayMessage={
                prevOpOk === true && selectedSim && isReady === true && phonieResult === 'ok' && batteryResult === null
                  ? "Basculer le bouton du boitier d'alimentation sur OFF"
                  : undefined
              }
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
              <div className="prompt-actions">
                <button
                  className="btn btn-yes btn-cta"
                  onClick={() => {
                    // Proceed immediately without awaiting the endpoint
                    setIsReady(true)
                    // Fire-and-forget the call; update status when it returns
                    if (callStatus !== 'pending') {
                      const phone = selectedSimPhone
                      if (!phone) {
                        setCallStatus('error')
                        setCallError('Aucun numéro associé à la carte SIM sélectionnée.')
                        return
                      }
                      setCallStatus('pending')
                      setCallError('')
                      callGsm({ phoneNumber: phone, audioOk: true })
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
                  OUI
                </button>
                <button className="btn btn-no btn-cta" onClick={() => setIsReady(false)}>NON</button>
              </div>
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
              null
            )}

            {prevOpOk === true && callStatus === 'success' && phonieResult === null && (
              <ImpactMessage variant="info" title="Appel en cours - Tester la phonie après les 4 BIPs" />
            )}

            {prevOpOk === true && selectedSim && isReady === true && phonieResult === null && (
              <div className="prompt-actions">
                <button
                  className="btn btn-yes btn-cta"
                  onClick={() => {
                    setPhonieResult('ok')
                    // Fire-and-forget hangup request; do not block UI
                    hangupGsm().catch(() => {})
                  }}
                >
                  Phonie OK
                </button>
                <button
                  className="btn btn-no btn-cta"
                  onClick={() => {
                    setPhonieResult('ko')
                    // Fire-and-forget hangup request; do not block UI
                    hangupGsm().catch(() => {})
                  }}
                >
                  Phonie KO
                </button>
              </div>
            )}

            {prevOpOk === true && phonieResult && (
              phonieResult === 'ok' ? (
                <ImpactMessage variant="success" title="Phonie réussie">Phonie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Phonie échouée">Échec du test</ImpactMessage>
              )
            )}

            

            {prevOpOk === true && selectedSim && isReady === true && phonieResult === 'ok' && batteryResult === null && (
              <div className="prompt-actions">
                <button className="btn btn-yes btn-cta" onClick={() => setBatteryResult('ok')}>Bascule: OK</button>
                <button className="btn btn-no btn-cta" onClick={() => setBatteryResult('ko')}>Bascule: KO</button>
              </div>
            )}

            {prevOpOk === true && batteryResult && (
              batteryResult === 'ok' ? (
                <ImpactMessage variant="success" title="Bascule batterie OK">Bascule batterie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Bascule batterie KO">Bascule batterie: Échec du test</ImpactMessage>
              )
            )}

            {prevOpOk === true && (batteryResult === 'ok' || batteryResult === 'ko') && (
              null
            )}
            {/* Final CTA pinned at the bottom of the panel body */}
            {(isGood || isBad) && (
              <div className="prompt-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-cta btn-next" onClick={resetAll}>Tester une autre carte</button>
              </div>
            )}
      </div>
    </div>
  )
}

export default Product
