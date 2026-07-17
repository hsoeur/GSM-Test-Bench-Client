import { useMemo, useEffect, useState } from 'react'
import TestStep from './TestStep.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { useOperator } from '../context/useOperator.js'
import { useProductTestFlow } from '../hooks/useProductTestFlow.js'
import { loadProductSimCards } from '../services/simCardLoadingService.js'
import { loadProductTestSequence } from '../services/testSequenceLoadingService.js'
import { handleProductScan } from '../services/productScanHandlerService.js'
import { submitProductTraceabilities } from '../services/productTraceabilitySubmissionService.js'
import { submitKitTraceabilityIfNeeded } from '../services/kitTraceabilitySubmissionService.js'
import { buildRetestScannedProduct } from '../services/retestConfirmationService.js'
import { handleProductWorkflowStep } from '../services/productStepWorkflowService.js'
import { getMachineUid, getProductStatusUids } from '../config/runtimeConfig.js'

function Product({ productLabel, simSelectId, currentOperationNumber, productUid, manufacturingOrderUid, assignedSimCardNumber }) {
  const { operator } = useOperator()
  
  const STATUS_UID = useMemo(() => getProductStatusUids(), [])

  const {
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
  } = useProductTestFlow()

  const [testSequence, setTestSequence] = useState(null)
  const [testSequenceFileName, setTestSequenceFileName] = useState('')

  // Default first step when no test sequence is loaded yet
  const defaultFirstStep = useMemo(() => ({
    id: 'scan-label',
    instruction: "Scanner l'étiquette de lot du produit.",
    pictogram: 'barcode-scan',
    actionType: 'scan',
    actionConfig: {
      placeholder: 'Scannez ou saisissez le code...',
      validation: 'label',
      autoFocus: true
    }
  }), [])

  const steps = useMemo(() => {
    const sequence = testSequence?.testSequence || []
    if (sequence.length === 0 && testData.scannedProducts.length === 0) {
      return [defaultFirstStep]
    }
    if (assignedSimCardNumber) {
      const simStep = {
        id: 'sim-instruction',
        instruction: `Mettre la carte SIM ${assignedSimCardNumber} dans le produit.`,
        pictogram: 'sim-card',
        actionType: 'button',
        actionConfig: { label: 'Continuer', variant: 'primary' }
      }
      const insertIdx = sequence.findIndex(s => s.id === 'insert-sim')
      if (insertIdx >= 0) {
        return [...sequence.slice(0, insertIdx), simStep, ...sequence.slice(insertIdx)]
      }
      return [simStep, ...sequence]
    }
    return sequence
  }, [testSequence, testData.scannedProducts, assignedSimCardNumber, defaultFirstStep])
  
  const currentStep = steps[currentStepIndex] || null

  // Load SIM cards on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await loadProductSimCards({ productLabel, assignedSimCardNumber, timeoutMs: 5000 })
        if (cancelled) return
        if (!result.ok) {
          setError(result.errorMessage)
          setTestData(prev => ({ ...prev, simOptions: [], simList: [] }))
          return
        }
        setTestData(prev => ({
          ...prev,
          simOptions: result.simOptions,
          simList: result.simList,
          selectedSim: result.selectedSim || prev.selectedSim,
        }))
      } catch (e) {
        console.error(`❌ [${productLabel}] Exception lors du chargement des SIM :`, e)
        setError("Impossible de récupérer la liste des cartes SIM.")
        if (!cancelled) {
          setTestData(prev => ({ ...prev, simOptions: [], simList: [] }))
        }
      }
    })()
    return () => { cancelled = true }
  }, [assignedSimCardNumber, productLabel, setError, setTestData])

  // Restore last selected SIM from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sim:last:${simSelectId}`) || ''
      if (saved) {
        setTestData(prev => ({ ...prev, selectedSim: saved }))
      }
    } catch (error) {
      void error
      // ignore
    }
  }, [simSelectId, setTestData])

  // Load test sequence when productUid is provided (from Manufacturing Order scan)
  useEffect(() => {
    if (!productUid) return

    let cancelled = false
    ;(async () => {
      const result = await loadProductTestSequence({ productUid, manufacturingOrderUid })
      if (cancelled) return
      if (!result.ok) {
        setError(result.errorMessage)
        return
      }
      setTestSequence(result.sequence)
      setTestSequenceFileName(result.fileName)
    })()
    return () => { cancelled = true }
  }, [productUid, manufacturingOrderUid, setError])

  const selectedSimPhone = useMemo(() => {
    const { selectedSim, simList } = testData
    if (!selectedSim) return ''
    const sim = simList.find((s) => String(s?.simCardUid || '') === String(selectedSim))
    return String(sim?.phoneNumber || '')
  }, [testData])

  const submitTraceability = async (status) => {
    try {
      const machineUid = getMachineUid()
      const statusUid = status === 'OK' ? STATUS_UID.OK : STATUS_UID.KO
      
      // Utiliser la ref au lieu du state pour avoir les données synchrones
      const productsToTrace = scannedProductsRef.current
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💾 ENREGISTREMENT TRAÇABILITÉ')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 Statut:', status)
      console.log('📦 Nombre de produits:', productsToTrace.length)
      console.log('')
      
      await submitProductTraceabilities({
        productsToTrace,
        statusUid,
        operator,
        testStartTs: testStartTsRef.current,
        currentOperationNumber,
        machineUid,
      })
      
      console.log('✅ Traçabilités enregistrées')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      
      await submitKitTraceabilityIfNeeded({ status, productsToTrace, operator })
    } catch (err) {
      console.error('❌ ERREUR lors de l\'enregistrement de la traçabilité')
      console.error('   └─', err)
      console.log('')
      // Ignore errors to avoid blocking UI
    }
  }

  const handleConfirmRetest = () => {
    // Démarrer le chrono si c'est le premier produit
    if (scannedProductsRef.current.length === 0) {
      testStartTsRef.current = Date.now()
      setTestData(prev => ({ ...prev, testStartTs: Date.now() }))
    }
    
    // Ajouter le produit confirmé à la liste des produits scannés
    if (retestConfirmation) {
      const scannedProduct = buildRetestScannedProduct(retestConfirmation)
      
      // Ajouter à la ref
      scannedProductsRef.current = [...scannedProductsRef.current, scannedProduct]
      
      // Ajouter au state
      setTestData(prev => ({
        ...prev,
        scannedProducts: [...prev.scannedProducts, scannedProduct]
      }))
      
      console.log('✅ Produit ajouté après confirmation de retest')
      console.log('📊 Total produits scannés:', scannedProductsRef.current.length)
    }
    
    setRetestConfirmation(null)
    setCurrentStepIndex(prev => prev + 1)
  }

  const handleCancelRetest = () => {
    setRetestConfirmation(null)
    resetAll()
  }

  const handleStepNext = async (stepId, value) => {
    setError('')
    setLoading(true)

    try {
      // Gérer tous les scans (scan-label, scan-label-2, etc.)
      if (stepId.startsWith('scan-label')) {
        // Démarrer le chrono au premier scan
        if (scannedProductsRef.current.length === 0) {
          testStartTsRef.current = Date.now()
          setTestData(prev => ({ ...prev, testStartTs: Date.now() }))
        }

        const scanValidation = await handleProductScan({
          value,
          stepId,
          testSequence,
          productUid,
          manufacturingOrderUid,
          currentOperationNumber,
          okStatusUid: STATUS_UID.OK,
        })

        if (scanValidation.type === 'error') {
          setError(scanValidation.errorMessage)
          return
        }

        if (scanValidation.type === 'retest') {
          setRetestConfirmation(scanValidation.retestConfirmation)
          return
        }

        const scannedProduct = scanValidation.scannedProduct

        // Ajouter le produit scanné à la ref (synchrone)
        scannedProductsRef.current = [...scannedProductsRef.current, scannedProduct]

        // Ajouter le produit scanné au state (pour l'affichage)
        setTestData(prev => ({
          ...prev,
          scannedProducts: [...prev.scannedProducts, scannedProduct]
        }))

        console.log('✅ Produit ajouté à la liste des produits scannés')
        console.log('📊 Total produits scannés:', scannedProductsRef.current.length)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('')

        // Move to next step
        setCurrentStepIndex(prev => prev + 1)
        return
      }

      await handleProductWorkflowStep({
        stepId,
        value,
        steps,
        selectedSimPhone,
        simSelectId,
        productUid,
        scannedProduct: scannedProductsRef.current[0],
        setTestData,
        setError,
        setCurrentStepIndex,
        submitTraceability,
        resetAll,
      })
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  const isBad = testData.isReady === false || testData.phonieResult === 'ko' || testData.batteryResult === 'ko' || testData.switchOffResult === 'ko' || testData.checkIntercoResult === 'ko'
  const hasTestBattery = steps.some(step => step.id === 'test-battery')
  const hasPostPhonieChoices = steps.some(step => step.id === 'switch-off' || step.id === 'check-interco')
  const isGood = hasTestBattery 
    ? testData.batteryResult === 'ok'
    : hasPostPhonieChoices
      ? testData.phonieResult === 'ok' && testData.isReady === true && testData.switchOffResult === 'ok' && testData.checkIntercoResult === 'ok'
      : testData.phonieResult === 'ok' && testData.isReady === true

  return (
    <div className={`panel ${isGood ? 'good' : (isBad ? 'bad' : '')}`}>
      <div className="panel-header">
        <h2>{productLabel}</h2>
        {assignedSimCardNumber && (
          <div style={{
            fontSize: '0.9rem',
            color: '#374151',
            marginTop: '0.4rem',
          }}>
            📶 SIM : <strong>{assignedSimCardNumber}</strong>
          </div>
        )}
        {testSequenceFileName && (
          <div className="panel-info" style={{ 
            fontSize: '0.95rem', 
            fontWeight: '600',
            color: '#2563eb',
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#eff6ff',
            borderRadius: '4px',
            border: '1px solid #bfdbfe'
          }}>
            📋 Séquence de test : {testSequenceFileName}
          </div>
        )}
        {testData.scannedProducts.length > 0 && (
          <span className="panel-subtitle">
            {testData.scannedProducts.map((p, idx) => (
              <span key={idx}>
                {idx > 0 && ' | '}
                {testData.scannedProducts.length > 1 ? `Carte ${idx + 1}: ` : 'Code en test: '}
                {p.serialLabel}
              </span>
            ))}
          </span>
        )}
      </div>
      
      <div className="panel-body">
        {retestConfirmation && (
          <ImpactMessage
            variant="warning"
            title="Produit déjà testé"
            actions={(
              <>
                <button className="btn" onClick={handleConfirmRetest}>Retester</button>
                <button className="btn-ghost" onClick={handleCancelRetest}>Annuler</button>
              </>
            )}
          >
            Ce produit a déjà été testé BON. Voulez-vous le retester ?
          </ImpactMessage>
        )}

        {error && !retestConfirmation && (
          <ImpactMessage
            variant="error"
            title="Erreur"
            actions={<button className="btn" onClick={resetAll}>Recommencer</button>}
          >
            {error}
          </ImpactMessage>
        )}

        {!error && !retestConfirmation && currentStep && (
          <TestStep
            key={`${currentStep.id}-${currentStepIndex}`}
            step={currentStep}
            data={testData}
            hasTestBattery={steps.some(step => step.id === 'test-battery')}
            onNext={handleStepNext}
            onError={(err) => setError(String(err?.message || err))}
          />
        )}
      </div>
    </div>
  )
}

export default Product
