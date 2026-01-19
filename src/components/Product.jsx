import { useState, useMemo, useEffect } from 'react'
import ProgressBar from './ProgressBar.jsx'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import ShapeDisplay from './ShapeDisplay.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'

function Product({ productLabel, simSelectId }) {
  // Manufacturing order context
  const [labelScan, setLabelScan] = useState('')
  const [ofUid, setOfUid] = useState('')
  const [serialLabel, setSerialLabel] = useState('')
  const [productUid, setProductUid] = useState('')
  const [moLoading, setMoLoading] = useState(false)
  const [moError, setMoError] = useState('')

  const [serial, setSerial] = useState('')
  const [showSimSelect, setShowSimSelect] = useState(false)
  const [selectedSim, setSelectedSim] = useState('')
  const [isReady, setIsReady] = useState(null)
  const [phonieResult, setPhonieResult] = useState(null) // 'ok' | 'ko' | null
  const [batteryResult, setBatteryResult] = useState(null) // 'ok' | 'ko' | null

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
    // Use label SN as the working serial and reveal SIM selection
    setSerial(serialPart.toUpperCase())
    setShowSimSelect(true)
    try {
      const saved = localStorage.getItem(simStorageKey) || ''
      setSelectedSim(saved)
    } catch (e) {
      setSelectedSim('')
    }
    setIsReady(null)
    setPhonieResult(null)
    setBatteryResult(null)
    setMoError('')
    setMoLoading(true)
    try {
      const { ok, data, status } = await getManufacturingOrderByUid(ofPart)
      if (!ok || !data) {
        setMoError(`Échec récupération OF (${status})`)
        setProductUid('')
      } else {
        setProductUid(String(data.productUid || ''))
        // Persist minimal context
        try {
          localStorage.setItem('current:manufacturingOrderUid', String(data.manufacturingOrderUid || ofPart))
          localStorage.setItem('current:productUid', String(data.productUid || ''))
          localStorage.setItem('current:serialNumber', String(serialPart || ''))
        } catch {}
      }
    } catch (e) {
      setMoError(String(e?.message || e))
      setProductUid('')
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
    setLabelScan('')
    setOfUid('')
    setSerialLabel('')
    setProductUid('')
    setMoError('')
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
                title={moError ? 'OF introuvable' : 'Contexte OF en cours'}
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

            <div style={{ marginBottom: 12 }}>
              <ProgressBar value={progressPct} label={`Avancement du test: ${progressPct}%`} />
            </div>

            {showSimSelect && (
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

            {selectedSim && isReady === null && (
              <ImpactMessage
                variant="info"
                title="Confirmez l’état READY"
                actions={(
                  <>
                    <button className="btn" onClick={() => setIsReady(true)}>Oui</button>
                    <button className="btn" onClick={() => setIsReady(false)}>Non</button>
                  </>
                )}
              >
                Le produit est-il en mode READY (bien initialisé) ?
              </ImpactMessage>
            )}

            {selectedSim && isReady === false && (
              <ImpactMessage
                variant="error"
                title="Initialisation incomplète"
                actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
              >
                Le produit n'est pas bien initialisé.
              </ImpactMessage>
            )}

            {selectedSim && isReady === true && phonieResult === null && (
              <ImpactMessage
                variant="info"
                title="Tester la Phonie"
                actions={(
                  <>
                    <button className="btn" onClick={() => setPhonieResult('ok')}>Phonie OK</button>
                    <button className="btn" onClick={() => setPhonieResult('ko')}>Phonie KO</button>
                  </>
                )}
              >
                Effectuez le test de Phonie et sélectionnez le résultat.
              </ImpactMessage>
            )}

            {phonieResult && (
              phonieResult === 'ok' ? (
                <ImpactMessage variant="success" title="Phonie réussie">Phonie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Phonie échouée">Échec du test</ImpactMessage>
              )
            )}

            {phonieResult === 'ko' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setPhonieResult(null)}>Retester ce produit</button>
                <button className="btn" onClick={resetAll}>Tester un autre produit</button>
              </div>
            )}

            {selectedSim && isReady === true && phonieResult === 'ok' && batteryResult === null && (
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

            {batteryResult && (
              batteryResult === 'ok' ? (
                <ImpactMessage variant="success" title="Bascule batterie OK">Bascule batterie: OK</ImpactMessage>
              ) : (
                <ImpactMessage variant="error" title="Bascule batterie KO">Bascule batterie: Échec du test</ImpactMessage>
              )
            )}

            {(batteryResult === 'ok' || batteryResult === 'ko') && (
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={resetAll}>Tester un autre produit</button>
                
              </div>
            )}
      </div>
    </div>
  )
}

export default Product
