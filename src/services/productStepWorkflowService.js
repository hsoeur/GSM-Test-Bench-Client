import { hangupGsmAudioCheck, startGsmAudioCheck } from './productGsmStepService.js'
import { submitOkTraceabilityAndPrintLabels } from './productFinalizationService.js'

export async function handleProductWorkflowStep({
  stepId,
  value,
  steps = [],
  selectedSimPhone,
  simSelectId,
  productUid,
  scannedProduct,
  setTestData,
  setError,
  setCurrentStepIndex,
  submitTraceability,
  resetAll,
} = {}) {
  switch (stepId) {
    case 'select-sim': {
      setTestData(prev => ({ ...prev, selectedSim: value }))
      try {
        localStorage.setItem(`sim:last:${simSelectId}`, value)
      } catch (error) {
        void error
      }
      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'insert-sim': {
      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'check-init': {
      if (value === 'ko') {
        setTestData(prev => ({ ...prev, isReady: false }))
        await submitTraceability('KO')
        setCurrentStepIndex(steps.length - 1)
        break
      }

      const gsmStart = startGsmAudioCheck({
        phoneNumber: selectedSimPhone,
        onStatusChange: (gsmCallStatus) => setTestData(prev => ({ ...prev, gsmCallStatus })),
      })

      if (!gsmStart.ok) {
        setError(gsmStart.errorMessage)
        return
      }

      setTestData(prev => ({ ...prev, isReady: true }))
      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'test-phonie': {
      try {
        await hangupGsmAudioCheck()
        setTestData(prev => ({ ...prev, gsmCallStatus: 'idle' }))
      } catch (error) {
        void error
      }

      if (value === 'ko') {
        setTestData(prev => ({ ...prev, phonieResult: 'ko' }))
        await submitTraceability('KO')
        setCurrentStepIndex(steps.length - 1)
        break
      }

      setTestData(prev => ({ ...prev, phonieResult: 'ok' }))

      const hasTestBattery = steps.some(step => step.id === 'test-battery')
      const hasPostPhonieChoices = steps.some(step => step.id === 'switch-off' || step.id === 'check-interco')
      if (!hasTestBattery && !hasPostPhonieChoices) {
        await submitTraceability('OK')
      }

      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'test-battery': {
      if (value === 'ko') {
        setTestData(prev => ({ ...prev, batteryResult: 'ko' }))
        await submitTraceability('KO')
        setCurrentStepIndex(steps.length - 1)
        break
      }

      setTestData(prev => ({ ...prev, batteryResult: 'ok' }))
      await submitOkTraceabilityAndPrintLabels({
        productUid,
        scannedProduct,
        submitTraceability,
      })

      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'switch-off': {
      if (value === 'ko') {
        setTestData(prev => ({ ...prev, switchOffResult: 'ko' }))
        await submitTraceability('KO')
        setCurrentStepIndex(steps.length - 1)
        break
      }
      setTestData(prev => ({ ...prev, switchOffResult: 'ok' }))
      setCurrentStepIndex(prev => prev + 1)
      break
    }

    case 'check-interco': {
      if (value === 'ko') {
        setTestData(prev => ({ ...prev, checkIntercoResult: 'ko' }))
        await submitTraceability('KO')
        setCurrentStepIndex(steps.length - 1)
        break
      }

      setTestData(prev => ({ ...prev, checkIntercoResult: 'ok' }))
      const hasTestBatteryAfter = steps.some(step => step.id === 'test-battery')
      if (!hasTestBatteryAfter) {
        await submitOkTraceabilityAndPrintLabels({
          productUid,
          scannedProduct,
          submitTraceability,
        })
      }
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
}
