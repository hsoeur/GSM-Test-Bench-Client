import { useState, useMemo, useEffect } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import ShapeDisplay from './ShapeDisplay.jsx'

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
        <span className="panel-subtitle">Veuillez scanner un numéro de série</span>
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
              <div className="prompt">
                <p style={{ margin: 0 }}>Le produit est-il en mode READY (bien initialisé) ?</p>
                <div className="prompt-actions" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => setIsReady(true)}>Oui</button>
                  <button className="btn" onClick={() => setIsReady(false)}>Non</button>
                </div>
              </div>
            )}

            {selectedSim && isReady === false && (
              <div className="prompt">
                <p style={{ margin: 0 }}>Le produit n'est pas bien initialisé.</p>
                <div className="prompt-actions" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={resetAll}>Recommencer</button>
                </div>
              </div>
            )}

            {selectedSim && isReady === true && phonieResult === null && (
              <div className="prompt">
                <p style={{ margin: 0 }}>Tester la Phonie et indiquer le résultat du test :</p>
                <div className="prompt-actions" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => setPhonieResult('ok')}>Phonie OK</button>
                  <button className="btn" onClick={() => setPhonieResult('ko')}>Phonie KO</button>
                </div>
              </div>
            )}

            {phonieResult && (
              <div className={`result ${phonieResult === 'ok' ? 'ok' : 'ko'}`}>
                {phonieResult === 'ok' ? 'Phonie: OK' : 'Échec du test'}
              </div>
            )}

            {phonieResult === 'ko' && (
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={resetAll}>Tester un autre produit</button>
              </div>
            )}

            {selectedSim && isReady === true && phonieResult === 'ok' && batteryResult === null && (
              <div className="prompt">
                <p style={{ margin: 0 }}>Basculez sur la batterie et vérifiez si la LED s’allume. Indiquez le résultat :</p>
                <div className="prompt-actions" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => setBatteryResult('ok')}>Bascule: OK</button>
                  <button className="btn" onClick={() => setBatteryResult('ko')}>Bascule: KO</button>
                </div>
              </div>
            )}

            {batteryResult && (
              <div className={`result ${batteryResult === 'ok' ? 'ok' : 'ko'}`}>
                {batteryResult === 'ok' ? 'Bascule batterie: OK' : 'Bascule batterie: Échec du test'}
              </div>
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
