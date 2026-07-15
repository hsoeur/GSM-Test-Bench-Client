import { useState, useMemo, useEffect, useRef } from 'react'
import TestStep from './TestStep.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { callGsm, hangupGsm } from '../services/gsmService.js'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { createProductTraceability } from '../services/productTraceabilityService.js'
import { createKitTraceability } from '../services/kitTraceabilityService.js'
import { useOperator } from '../context/useOperator.js'
import { loadProductSimCards } from '../services/simCardLoadingService.js'
import { loadProductTestSequence } from '../services/testSequenceLoadingService.js'
import { printConfiguredLabelsForProduct } from '../services/labelPrintingService.js'
import { parseScannedProductLabel } from '../services/scannedLabelParser.js'
import { validateScannedProduct } from '../services/scannedProductValidationService.js'
import { buildProductTraceabilityPayload } from '../services/traceabilityPayloadBuilder.js'
import { getMachineUid, getProductStatusUids } from '../config/runtimeConfig.js'

function Product({ productLabel, simSelectId, currentOperationNumber, productUid, manufacturingOrderUid, assignedSimCardNumber }) {
  const { operator } = useOperator()
  
  const STATUS_UID = useMemo(() => getProductStatusUids(), [])

  // Test sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [testData, setTestData] = useState({
    scannedProducts: [], // Array of { labelScan, serialLabel, ofUid, productUid }
    selectedSim: '',
    simOptions: [],
    simList: [],
    isReady: null,
    phonieResult: null,
    batteryResult: null,
    switchOffResult: null,
    checkIntercoResult: null,
    testStartTs: null,
    gsmCallStatus: 'idle', // idle | calling | connected | error
  })
  
  const [error, setError] = useState('')
  const [, setLoading] = useState(false)
  const [retestConfirmation, setRetestConfirmation] = useState(null) // { productUid, serialLabel, ofUid } when confirmation needed
  const [testSequence, setTestSequence] = useState(null)
  const [testSequenceFileName, setTestSequenceFileName] = useState('')
  const didSubmitRef = useRef(false)
  const scannedProductsRef = useRef([]) // Ref synchrone pour les produits scannés
  const testStartTsRef = useRef(null) // Ref synchrone pour le timestamp de début

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
  }, [assignedSimCardNumber, productLabel])

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
  }, [simSelectId])

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
  }, [productUid, manufacturingOrderUid])

  const selectedSimPhone = useMemo(() => {
    const { selectedSim, simList } = testData
    if (!selectedSim) return ''
    const sim = simList.find((s) => String(s?.simCardUid || '') === String(selectedSim))
    return String(sim?.phoneNumber || '')
  }, [testData])

  const resetAll = () => {
    didSubmitRef.current = false
    scannedProductsRef.current = []
    testStartTsRef.current = null
    setCurrentStepIndex(0)
    setTestData(prev => ({
      scannedProducts: [],
      selectedSim: prev.selectedSim,
      simOptions: prev.simOptions,
      simList: prev.simList,
      isReady: null,
      phonieResult: null,
      batteryResult: null,
      switchOffResult: null,
      checkIntercoResult: null,
      testStartTs: null,
      gsmCallStatus: 'idle',
    }))
    setError('')
    setLoading(false)
    setRetestConfirmation(null)
  }

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
      
      // Créer une traçabilité uniquement pour la mère (ou le seul produit scanné)
      // En cas de couple Mère/Fille, on ne trace PAS la fille
      const isMotherDaughterPair = productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid
      const productsToTraceFiltered = isMotherDaughterPair ? [productsToTrace[0]] : productsToTrace

      for (let i = 0; i < productsToTraceFiltered.length; i++) {
        const product = productsToTraceFiltered[i]
        
        console.log(`🌐 API CALL - createProductTraceability [Produit ${i + 1}/${productsToTraceFiltered.length}]${isMotherDaughterPair ? ' (Mère uniquement)' : ''}`)
        console.log('   └─ Endpoint: /api/ProductTraceability')
        
        const payload = buildProductTraceabilityPayload({
          product,
          statusUid,
          operator,
          testStartTs: testStartTsRef.current,
          currentOperationNumber,
          machineUid,
        })
        
        console.log('   └─ Payload:')
        console.log('      • productUid:', payload.productUid)
        console.log('      • productSerialNumber:', payload.productSerialNumber)
        console.log('      • productStatusUid:', payload.productStatusUid)
        console.log('      • manufacturingOrderUid:', payload.manufacturingOrderUid)
        console.log('      • userUid:', payload.userUid)
        console.log('      • cycleTime:', payload.cycleTime, 'ms')
        console.log('      • operationNumber:', payload.operationNumber)
        console.log('      • machineUid:', payload.machineUid)
        console.log('      • creationDate:', payload.creationDate)
        
        if (payload.productUid && payload.productSerialNumber && payload.manufacturingOrderUid) {
          const result = await createProductTraceability(payload)
          console.log('📥 RÉPONSE:')
          console.log('   └─ Status HTTP:', result?.status || 'N/A')
          console.log('   └─ Success:', result?.ok || false)
          console.log('   └─ Data:', result?.data || null)
          console.log('')
        } else {
          console.warn('⚠️  Données incomplètes, traçabilité non créée')
          console.log('   └─ productUid:', payload.productUid || '(manquant)')
          console.log('   └─ productSerialNumber:', payload.productSerialNumber || '(manquant)')
          console.log('   └─ manufacturingOrderUid:', payload.manufacturingOrderUid || '(manquant)')
          console.log('')
        }
      }
      
      console.log('✅ Traçabilités enregistrées')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      
      // Détection couple Mere/Fille: 2 produits scannés avec productUid différents
      // ⚠️ KitTraceability enregistré UNIQUEMENT si la carte est BONNE (status === 'OK')
      if (status === 'OK' && productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('👩‍👧 DÉTECTION COUPLE MERE/FILLE')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔍 Produit 1 (Mère):', productsToTrace[0].productUid, '- SN:', productsToTrace[0].serialLabel)
        console.log('🔍 Produit 2 (Fille):', productsToTrace[1].productUid, '- SN:', productsToTrace[1].serialLabel)
        console.log('')
        
        try {
          // Récupérer les infos de l'OF pour obtenir externalOrderNumber
          const motherProduct = productsToTrace[0]
          const daughterProduct = productsToTrace[1]
          
          console.log('🌐 API CALL - getManufacturingOrderByUid (pour clientOrder)')
          console.log('   └─ manufacturingOrderUid:', motherProduct.ofUid)
          
          const { ok: moOk, data: moData } = await getManufacturingOrderByUid(motherProduct.ofUid)
          
          console.log('📥 RÉPONSE:')
          console.log('   └─ Success:', moOk)
          console.log('   └─ Data:', moData)
          console.log('')
          
          const clientOrder = moOk && moData ? String(moData.externalOrderNumber || 'UNKNOWN_ORDER') : 'UNKNOWN_ORDER'
          
          const kitPayload = {
            kitTraceabilityUid: '', // AUTO GENERATED
            clientOrder: clientOrder, // DONNE PAR L'OF (champ externalOrderNumber)
            manufacturingOrderUid: Number(motherProduct.ofUid),
            product: String(motherProduct.productUid), // MERE
            horizonComponentCode: String(daughterProduct.productUid), // FILLE
            serialNumber: Number(motherProduct.serialLabel || 0), // SERIALNUMBER DE LA MERE
            scanFrame: String(daughterProduct.labelScan || ''), // ETIQUETTE SCANNEE DE LA FILLE
            date: new Date().toISOString(),
            userUid: operator ? String(operator.userUid) : '' // OPERATOR UID
          }
          
          console.log('🌐 API CALL - createKitTraceability')
          console.log('   └─ Endpoint: /api/KitTraceability/create')
          console.log('   └─ Payload:')
          console.log('      • clientOrder:', kitPayload.clientOrder)
          console.log('      • manufacturingOrderUid:', kitPayload.manufacturingOrderUid)
          console.log('      • product (Mère):', kitPayload.product)
          console.log('      • horizonComponentCode (Fille):', kitPayload.horizonComponentCode)
          console.log('      • serialNumber:', kitPayload.serialNumber)
          console.log('      • scanFrame:', kitPayload.scanFrame)
          console.log('      • date:', kitPayload.date)
          console.log('      • userUid:', kitPayload.userUid)
          console.log('')
          
          const kitResult = await createKitTraceability(kitPayload)
          
          console.log('📥 RÉPONSE:')
          console.log('   └─ Status HTTP:', kitResult?.status || 'N/A')
          console.log('   └─ Success:', kitResult?.ok || false)
          console.log('   └─ Data:', kitResult?.data || null)
          console.log('')
          
          if (kitResult.ok) {
            console.log('✅ Association Mère/Fille enregistrée avec succès')
          } else {
            console.warn('⚠️  Échec enregistrement association Mère/Fille - Status:', kitResult.status)
          }
        } catch (kitErr) {
          console.error('❌ ERREUR lors de l\'enregistrement de l\'association Mère/Fille')
          console.error('   └─', kitErr)
          // Continue despite error to avoid blocking UI
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('')
      } else if (productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid) {
        console.log('⚠️  Couple Mère/Fille détecté mais carte MAUVAISE (KO) - KitTraceability NON enregistré')
        console.log('')
      } else if (productsToTrace.length === 1) {
        console.log('ℹ️  Produit simple détecté (pas de couple Mère/Fille)')
        console.log('')
      } else if (productsToTrace.length > 2) {
        console.log('⚠️  Plus de 2 produits scannés - Pas d\'association Mère/Fille')
        console.log('')
      }
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
      const scannedProduct = {
        labelScan: '', // On ne l'a pas stocké dans retestConfirmation
        serialLabel: retestConfirmation.serialLabel,
        ofUid: retestConfirmation.ofUid,
        productUid: retestConfirmation.productUid
      }
      
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
        // Parse label and fetch MO
        const parsedLabel = parseScannedProductLabel(value)
        const raw = parsedLabel.raw
        const serialPart = parsedLabel.serialNumber
        const ofPart = parsedLabel.manufacturingOrderUid

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 SCAN PRODUIT')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🏷️  Étiquette scannée:', raw)
        console.log('🔢 Numéro de série:', serialPart)
        console.log('📋 OF:', ofPart)
        console.log('')

        // Démarrer le chrono au premier scan
        if (scannedProductsRef.current.length === 0) {
          testStartTsRef.current = Date.now()
          setTestData(prev => ({ ...prev, testStartTs: Date.now() }))
        }

        const scanValidation = await validateScannedProduct({
          parsedLabel,
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
          // Opérateur a inséré la SIM et mis le produit sous tension
          // Passer à l'étape suivante
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'check-init': {
          if (value === 'ko') {
            setTestData(prev => ({ ...prev, isReady: false }))
            await submitTraceability('KO')
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          // Vérifier le numéro de téléphone avant de passer à l'étape suivante
          const phone = selectedSimPhone
          if (!phone) {
            setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
            setError("Aucune carte SIM sélectionnée ou numéro de téléphone manquant. Vérifiez la configuration SIM.")
            return
          }

          setTestData(prev => ({ ...prev, isReady: true, gsmCallStatus: 'calling' }))

          // Initier l'appel GSM sans attendre la réponse (fire & forget)
          // pour éviter le timeout selon le produit appelé
          callGsm({ phoneNumber: phone, audioOk: true })
            .then(({ ok }) => {
              if (!ok) {
                setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
              } else {
                setTestData(prev => ({ ...prev, gsmCallStatus: 'connected' }))
              }
            })
            .catch(() => {
              setTestData(prev => ({ ...prev, gsmCallStatus: 'error' }))
            })

          // Passer immédiatement à l'étape suivante sans attendre la réponse API
          setCurrentStepIndex(prev => prev + 1)
          break
        }

        case 'test-phonie': {
          // Hangup call
          try {
            await hangupGsm()
            setTestData(prev => ({ ...prev, gsmCallStatus: 'idle' }))
          } catch (error) {
            void error
          }

          if (value === 'ko') {
            setTestData(prev => ({ ...prev, phonieResult: 'ko' }))
            await submitTraceability('KO')
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          setTestData(prev => ({ ...prev, phonieResult: 'ok' }))
          
          // Si test-battery, switch-off ou check-interco existent, ne pas soumettre maintenant
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
            // Aller directement à l'étape finale pour tester une autre carte
            setCurrentStepIndex(steps.length - 1)
            break
          }

          setTestData(prev => ({ ...prev, batteryResult: 'ok' }))
          await submitTraceability('OK')

          await printConfiguredLabelsForProduct(productUid, scannedProductsRef.current[0])

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
          // Les deux tests visuels sont OK → soumettre OK si pas de test-battery après
          const hasTestBatteryAfter = steps.some(step => step.id === 'test-battery')
          if (!hasTestBatteryAfter) {
            await submitTraceability('OK')

            await printConfiguredLabelsForProduct(productUid, scannedProductsRef.current[0])
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
