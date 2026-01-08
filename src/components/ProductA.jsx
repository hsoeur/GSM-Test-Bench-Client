import { useState, useMemo } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import TestSequence from './TestSequence.jsx'

function ProductA() {
  const [serial, setSerial] = useState('')
  const [started, setStarted] = useState(false)
  const [showSimSelect, setShowSimSelect] = useState(false)
  const [selectedSim, setSelectedSim] = useState('')

  const validateSerial = useMemo(() => {
    // Série: lettres/chiffres, 6 à 20 caractères (ajustable)
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
    setSelectedSim('')
    setShowSimSelect(true)
  }

  const handleContinue = () => {
    if (!selectedSim) return
    setStarted(true)
  }

  return (
    <div className="panel">
      {!started ? (
        <>
          <div className="panel-header">
            <h2>Product A</h2>
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
                id="simSelectA"
                options={simOptions}
                value={selectedSim}
                onChange={setSelectedSim}
                onConfirm={handleContinue}
              />
            )}
          </div>
        </>
      ) : (
        <TestSequence serial={serial} product="Product A" sim={selectedSim} />
      )}
    </div>
  )
}

export default ProductA
