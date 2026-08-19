import { logger } from './loggerService.js'
import { validateManufacturingOrder } from './manufacturingOrderValidationService.js'
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
  const productSuffix = parsedLabel.productSuffix
  const serialPart = parsedLabel.serialNumber
  const ofPart = parsedLabel.manufacturingOrderUid

  logger.info('🌐 API CALL #1 - validateManufacturingOrder')
  logger.info('   └─ Endpoint: POST /api/ManufacturingOrders/validate')
  logger.info('   └─ Suffixe produit:', productSuffix)
  logger.info('   └─ Numéro de série:', serialPart)
  logger.info('   └─ OF:', ofPart)

  const { ok, data, status, errorMessage } = await validateManufacturingOrder({
    productSuffix,
    serialNumber: serialPart,
    manufacturingOrderId: ofPart,
  })

  logger.info('📥 RÉPONSE:')
  logger.info('   └─ Status HTTP:', status)
  logger.info('   └─ Success:', ok)
  logger.info('   └─ Data:', data)
  logger.info('')

  if (!ok || !data) {
    logger.error('❌ Échec validation OF - Status:', status)
    return {
      type: 'error',
      errorMessage: errorMessage || `Échec validation OF (${status})`,
    }
  }

  const scannedProductUid = String(data.productUid || '')
  logger.info('✅ ProductUid récupéré (étiquette):', scannedProductUid)
  logger.info('🏭 ProductUid OF initial (traça):', productUid)
  logger.info('📋 ManufacturingOrderUid OF initial (traça):', manufacturingOrderUid)
  logger.info('')

  const loadedSteps = testSequence?.testSequence || []
  const currentStepData = loadedSteps.find(step => step.id === stepId)
  const previousOperationUid = currentStepData?.actionConfig?.previousOperationUid || null
  const productUidForCheck = currentStepData?.actionConfig?.checkProductUid || currentStepData?.actionConfig?.productUid || scannedProductUid

  if (previousOperationUid) {
    logger.info('🌐 API CALL #2 - getLatestProductTraceability (vérification N-1)')
    logger.info('   └─ Endpoint: /api/ProductTraceabilities/latest-by-product-serial-and-operation')
    logger.info('   └─ Paramètres:')
    logger.info('      • productUid:', productUidForCheck, currentStepData?.actionConfig?.productUid ? '(depuis config étape)' : '(depuis OF)')
    logger.info('      • serialNumber:', serialPart)
    logger.info('      • operationUid:', previousOperationUid)

    const { ok: ok2, status: st2, data: prevTrace } = await getLatestProductTraceability(
      productUidForCheck,
      serialPart,
      previousOperationUid,
    )

    logger.info('📥 RÉPONSE:')
    logger.info('   └─ Status HTTP:', st2)
    logger.info('   └─ Success:', ok2)
    logger.info('   └─ Data:', prevTrace)
    logger.info('')

    if (!ok2) {
      logger.error('❌ Échec vérification étape précédente')
      if (st2 === 404) {
        logger.error('   └─ 404: Aucune traçabilité trouvée')
        return { type: 'error', errorMessage: "Aucune traçabilité trouvée pour l'opération précédente." }
      }
      logger.error('   └─ Status HTTP:', st2)
      return { type: 'error', errorMessage: `Échec vérification étape précédente (${st2})` }
    }

    if (!prevTrace || prevTrace.productStatusUid !== okStatusUid) {
      logger.error('❌ Produit NON VALIDE à l\'étape précédente')
      logger.info('   └─ Status trouvé:', prevTrace?.productStatusUid || '(aucun)')
      return { type: 'error', errorMessage: "Produit non valide à l'étape de fabrication précédente." }
    }

    logger.info('✅ Produit VALIDE à l\'étape précédente')
    logger.info('   └─ Status:', prevTrace.productStatusUid)
    logger.info('')
  } else {
    logger.info('⚠️  Aucune vérification N-1 configurée (previousOperationUid manquant)')
    logger.info('')
  }

  const productUidForTraceability = currentStepData?.actionConfig?.productUid || productUid

  logger.info('🌐 API CALL #3 - getLatestProductTraceability')
  logger.info('   └─ Endpoint: /api/ProductTraceability/latest')
  logger.info('   └─ Paramètres:')
  logger.info('      • productUid:', productUidForTraceability, currentStepData?.actionConfig?.productUid ? '(config étape)' : '(OF initial)')
  logger.info('      • serialNumber:', serialPart)
  logger.info('      • operationNumber:', currentOperationNumber)

  const { ok: ok3, status: st3, data: latestTrace } = await getLatestProductTraceability(
    productUidForTraceability,
    serialPart,
    currentOperationNumber,
  )

  logger.info('📥 RÉPONSE:')
  logger.info('   └─ Status HTTP:', st3)
  logger.info('   └─ Success:', ok3)
  logger.info('   └─ Data:', latestTrace)
  logger.info('')

  if (ok3 && latestTrace && latestTrace.productStatusUid === okStatusUid) {
    logger.warn('⚠️  Produit déjà testé BON à cette opération')
    logger.info('   └─ Demande de confirmation de retest...')
    logger.info('')
    return {
      type: 'retest',
      retestConfirmation: {
        productUid: productUidForTraceability,
        serialLabel: serialPart,
        ofUid: manufacturingOrderUid,
      },
    }
  }

  logger.info('✅ Produit non encore testé (ou KO) à cette opération')
  logger.info('')

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
