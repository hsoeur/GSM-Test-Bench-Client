import { useState, useMemo } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import TestSequence from './TestSequence.jsx'

function ProductA() {
  const [serial, setSerial] = useState('')
  const [started, setStarted] = useState(false)

  const validateSerial = useMemo(() => {
    // Série: lettres/chiffres, 6 à 20 caractères (ajustable)
    const re = /^[A-Z0-9]{6,20}$/
    return (v) => re.test(v.toUpperCase())
  }, [])

  const handleValid = (value) => {
    const v = value.toUpperCase()
    setSerial(v)
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
          </div>
        </>
      ) : (
        <TestSequence serial={serial} product="Product A" />
      )}
    </div>
  )
}

export default ProductA
