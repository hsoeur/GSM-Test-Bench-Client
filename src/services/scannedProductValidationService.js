import { getManufacturingOrderByUid } from './manufacturingOrderService.js'
import { getLatestProductTraceability } from './productTraceabilityService.js'

export async function validateScannedProduct({
  parsedLabel,
  stepId,
  testSequence,
  productUid,
  manufacturingOrderUid,
  currentOperationNumber,
  okStatusUid,
} = {}) {
  const raw = parsedLabel.raw
  const serialPart = parsedLabel.serialNumber
  const ofPart = parsedLabel.manufacturingOrderUid

  console.log('🌐 API CALL #1 - getManufacturingOrderByUid')
  console.log('   └─ Endpoint: /api/ManufacturingOrder/by-manufacturing-order-uid')
  console.log('   └─ Paramètre: manufacturingOrderUid =', ofPart)

  const { ok, data, status } = await getManufacturingOrderByUid(ofPart)

  console.log('📥 RÉPONSE:')
  console.log('   └─ Status HTTP:', status)
  console.log('   └─ Success:', ok)
  console.log('   └─ Data:', data)
  console.log('')

  if (!ok || !data) {
    console.error('❌ Échec récupération OF - Status:', status)
    return {
      type: 'error',
      errorMessage: `Échec récupération OF (${status})`,
    }
  }

  const scannedProductUid = String(data.productUid || '')
  console.log('✅ ProductUid récupéré (étiquette):', scannedProductUid)
  console.log('🏭 ProductUid OF initial (traça):', productUid)
  console.log('📋 ManufacturingOrderUid OF initial (traça):', manufacturingOrderUid)
  console.log('')

  const loadedSteps = testSequence?.testSequence || []
  const currentStepData = loadedSteps.find(step => step.id === stepId)
  const previousOperationUid = currentStepData?.actionConfig?.previousOperationUid || null
  const productUidForCheck = currentStepData?.actionConfig?.checkProductUid || currentStepData?.actionConfig?.productUid || scannedProductUid

  if (previousOperationUid) {
    console.log('🌐 API CALL #2 - getLatestProductTraceability (vérification N-1)')
    console.log('   └─ Endpoint: /api/ProductTraceabilities/latest-by-product-serial-and-operation')
    console.log('   └─ Paramètres:')
    console.log('      • productUid:', productUidForCheck, currentStepData?.actionConfig?.productUid ? '(depuis config étape)' : '(depuis OF)')
    console.log('      • serialNumber:', serialPart)
    console.log('      • operationUid:', previousOperationUid)

    const { ok: ok2, status: st2, data: prevTrace } = await getLatestProductTraceability(
      productUidForCheck,
      serialPart,
      previousOperationUid,
    )

    console.log('📥 RÉPONSE:')
    console.log('   └─ Status HTTP:', st2)
    console.log('   └─ Success:', ok2)
    console.log('   └─ Data:', prevTrace)
    console.log('')

    if (!ok2) {
      console.error('❌ Échec vérification étape précédente')
      if (st2 === 404) {
        console.error('   └─ 404: Aucune traçabilité trouvée')
        return { type: 'error', errorMessage: "Aucune traçabilité trouvée pour l'opération précédente." }
      }
      console.error('   └─ Status HTTP:', st2)
      return { type: 'error', errorMessage: `Échec vérification étape précédente (${st2})` }
    }

    if (!prevTrace || prevTrace.productStatusUid !== okStatusUid) {
      console.error('❌ Produit NON VALIDE à l\'étape précédente')
      console.log('   └─ Status trouvé:', prevTrace?.productStatusUid || '(aucun)')
      return { type: 'error', errorMessage: "Produit non valide à l'étape de fabrication précédente." }
    }

    console.log('✅ Produit VALIDE à l\'étape précédente')
    console.log('   └─ Status:', prevTrace.productStatusUid)
    console.log('')
  } else {
    console.log('⚠️  Aucune vérification N-1 configurée (previousOperationUid manquant)')
    console.log('')
  }

  const productUidForTraceability = currentStepData?.actionConfig?.productUid || productUid

  console.log('🌐 API CALL #3 - getLatestProductTraceability')
  console.log('   └─ Endpoint: /api/ProductTraceability/latest')
  console.log('   └─ Paramètres:')
  console.log('      • productUid:', productUidForTraceability, currentStepData?.actionConfig?.productUid ? '(config étape)' : '(OF initial)')
  console.log('      • serialNumber:', serialPart)
  console.log('      • operationNumber:', currentOperationNumber)

  const { ok: ok3, status: st3, data: latestTrace } = await getLatestProductTraceability(
    productUidForTraceability,
    serialPart,
    currentOperationNumber,
  )

  console.log('📥 RÉPONSE:')
  console.log('   └─ Status HTTP:', st3)
  console.log('   └─ Success:', ok3)
  console.log('   └─ Data:', latestTrace)
  console.log('')

  if (ok3 && latestTrace && latestTrace.productStatusUid === okStatusUid) {
    console.warn('⚠️  Produit déjà testé BON à cette opération')
    console.log('   └─ Demande de confirmation de retest...')
    console.log('')
    return {
      type: 'retest',
      retestConfirmation: {
        productUid: productUidForTraceability,
        serialLabel: serialPart,
        ofUid: manufacturingOrderUid,
      },
    }
  }

  console.log('✅ Produit non encore testé (ou KO) à cette opération')
  console.log('')

  return {
    type: 'valid',
    scannedProduct: {
      labelScan: raw,
      serialLabel: serialPart,
      ofUid: manufacturingOrderUid,
      productUid: productUidForTraceability,
    },
  }
}
