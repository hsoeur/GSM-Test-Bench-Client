import { useState, useMemo, useEffect } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import ShapeDisplay from './ShapeDisplay.jsx'
import ImpactMessage from './ImpactMessage.jsx'

function Product({ productLabel, simSelectId }) {
  const [serial, setSerial] = useState('')
  const [showSimSelect, setShowSimSelect] = useState(false)
  const [selectedSim, setSelectedSim] = useState('')
  const [isReady, setIsReady] = useState(null)
  const [phonieResult, setPhonieResult] = useState(null) // 'ok' | 'ko' | null
  const [batteryResult, setBatteryResult] = useState(null) // 'ok' | 'ko' | null

  const simStorageKey = useMemo(() => `sim:last:${simSelectId}`,[simSelectId])

  const validateSerial = useMemo(() => {
    const re = /^[A-Z0-9]{6,20}$/
    return (v) => re.test(v.toUpperCase())
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

  const handleValid = (value) => {
    const v = value.toUpperCase()
    setSerial(v)
    setShowSimSelect(true)
    // Restore last SIM used for this product if available
    try {
      const saved = localStorage.getItem(simStorageKey) || ''
      setSelectedSim(saved)
    } catch (e) {
      setSelectedSim('')
    }
    setIsReady(null)
    setPhonieResult(null)
    setBatteryResult(null)
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
  }


  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{productLabel}</h2>
      </div>
      <div className="panel-body">
            <KeyboardScanner
              title="Scanner Numéro de série"
              showCaptureButton={false}
              validate={validateSerial}
              onValid={handleValid}
              invalidMessage="Veuillez entrer un numéro de série valide"
              onScan={() => {}}
              showLastResult={false}
            />

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
              <div style={{ marginTop: 8 }}>
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
