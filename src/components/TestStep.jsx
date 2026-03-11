import { useState, useEffect } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import SimSelector from './SimSelector.jsx'
import Pictogram from './Pictogram.jsx'
import GsmInfo from './GsmInfo.jsx'

function TestStep({ step, data, onNext, onError }) {
  const [value, setValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Reset value when step changes
    setValue('')
    setIsProcessing(false)
  }, [step?.id])

  const handleAction = async (actionValue) => {
    setIsProcessing(true)
    try {
      await onNext(step.id, actionValue)
    } catch (error) {
      onError?.(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderAction = () => {
    const { actionType, actionConfig } = step

    switch (actionType) {
      case 'scan': {
        const validateLabel = (v) => {
          const parts = String(v).split(';').map((p) => p.trim()).filter(Boolean)
          return parts.length >= 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])
        }

        return (
          <KeyboardScanner
            title=""
            showCaptureButton={false}
            validate={validateLabel}
            onValid={(val) => handleAction(val)}
            invalidMessage="Étiquette invalide (format attendu avec points-virgules)"
            onScan={() => {}}
            showLastResult={false}
          />
        )
      }

      case 'select': {
        const options = data?.simOptions || []
        const currentValue = data?.selectedSim || value
        
        return (
          <div style={{ marginTop: 24 }}>
            <SimSelector
              id="step-sim-selector"
              options={options}
              value={currentValue}
              onChange={(val) => {
                setValue(val)
                handleAction(val)
              }}
            />
          </div>
        )
      }

      case 'choice': {
        return (
          <div className="prompt-actions" style={{ marginTop: 32 }}>
            {actionConfig.options.map((option) => (
              <button
                key={option.value}
                className={`btn btn-cta ${option.variant === 'success' ? 'btn-yes' : option.variant === 'error' ? 'btn-no' : ''}`}
                onClick={() => handleAction(option.value)}
                disabled={isProcessing}
              >
                {option.label}
              </button>
            ))}
          </div>
        )
      }

      case 'button': {
        return (
          <div className="prompt-actions" style={{ marginTop: 32 }}>
            <button
              className={`btn btn-cta ${actionConfig.variant === 'primary' ? 'btn-next' : ''}`}
              onClick={() => handleAction('next')}
              disabled={isProcessing}
            >
              {actionConfig.label}
            </button>
          </div>
        )
      }

      default:
        return null
    }
  }

  if (!step) return null

  // Déterminer les infos GSM à afficher
  const showGsmInfo = step.id === 'test-phonie' && data?.gsmCallStatus
  const selectedSim = data?.simList?.find(s => s.simCardUid === data?.selectedSim)
  const phoneNumber = selectedSim?.phoneNumber || ''

  // Déterminer le résultat pour l'étape finale
  const isBad = data?.isReady === false || data?.phonieResult === 'ko' || data?.batteryResult === 'ko'
  const isGood = data?.batteryResult === 'ok'
  
  // Message et pictogramme pour l'étape finale
  let finalInstruction = step.instruction
  let resultBadge = null
  let pictogramName = step.pictogram
  
  if (step.id === 'test-complete') {
    if (isGood) {
      resultBadge = <div className="result-badge result-badge-good">✅ ✅ CARTE BONNE ✅ ✅</div>
      finalInstruction = 'Test terminé. Débrancher batterie. Vous pouvez tester une nouvelle carte.'
      pictogramName = 'check-good'
    } else if (isBad) {
      resultBadge = <div className="result-badge result-badge-bad">❌ ❌ CARTE MAUVAISE ❌ ❌</div>
      finalInstruction = 'Test terminé. Débrancher batterie. Vous pouvez tester une nouvelle carte.'
      pictogramName = 'check-bad'
    }
  }

  return (
    <div className="test-step">
      {resultBadge}
      
      <div className="test-step-pictogram">
        <Pictogram name={pictogramName} />
      </div>
      
      <div className="test-step-instruction">
        {finalInstruction}
      </div>

      {showGsmInfo && (
        <GsmInfo
          phoneNumber={phoneNumber}
          status={data.gsmCallStatus}
          simUid={data.selectedSim}
        />
      )}

      <div className="test-step-action">
        {renderAction()}
      </div>
    </div>
  )
}

export default TestStep
