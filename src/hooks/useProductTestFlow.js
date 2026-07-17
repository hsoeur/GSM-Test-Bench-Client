import { useCallback, useRef, useState } from 'react'

const createInitialTestData = () => ({
  scannedProducts: [],
  selectedSim: '',
  simOptions: [],
  simList: [],
  isReady: null,
  phonieResult: null,
  batteryResult: null,
  switchOffResult: null,
  checkIntercoResult: null,
  testStartTs: null,
  gsmCallStatus: 'idle',
})

export function useProductTestFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [testData, setTestData] = useState(createInitialTestData)
  const [error, setError] = useState('')
  const [, setLoading] = useState(false)
  const [retestConfirmation, setRetestConfirmation] = useState(null)

  const scannedProductsRef = useRef([])
  const testStartTsRef = useRef(null)

  const resetAll = useCallback(() => {
    scannedProductsRef.current = []
    testStartTsRef.current = null
    setCurrentStepIndex(0)
    setTestData(prev => ({
      ...createInitialTestData(),
      selectedSim: prev.selectedSim,
      simOptions: prev.simOptions,
      simList: prev.simList,
    }))
    setError('')
    setLoading(false)
    setRetestConfirmation(null)
  }, [])

  return {
    currentStepIndex,
    setCurrentStepIndex,
    testData,
    setTestData,
    error,
    setError,
    setLoading,
    retestConfirmation,
    setRetestConfirmation,
    scannedProductsRef,
    testStartTsRef,
    resetAll,
  }
}
