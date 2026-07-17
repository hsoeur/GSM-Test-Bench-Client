import { logger } from './loggerService.js'
import { createProductTraceability } from './productTraceabilityService.js'
import { buildProductTraceabilityPayload } from './traceabilityPayloadBuilder.js'

const isMotherDaughterPair = (productsToTrace) =>
  productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid

export async function submitProductTraceabilities({
  productsToTrace = [],
  statusUid,
  operator,
  testStartTs,
  currentOperationNumber,
  machineUid,
} = {}) {
  const motherDaughterPair = isMotherDaughterPair(productsToTrace)
  const productsToTraceFiltered = motherDaughterPair ? [productsToTrace[0]] : productsToTrace

  for (let i = 0; i < productsToTraceFiltered.length; i++) {
    const product = productsToTraceFiltered[i]

    logger.info(`🌐 API CALL - createProductTraceability [Produit ${i + 1}/${productsToTraceFiltered.length}]${motherDaughterPair ? ' (Mère uniquement)' : ''}`)
    logger.info('   └─ Endpoint: /api/ProductTraceability')

    const payload = buildProductTraceabilityPayload({
      product,
      statusUid,
      operator,
      testStartTs,
      currentOperationNumber,
      machineUid,
    })

    logger.info('   └─ Payload:')
    logger.info('      • productUid:', payload.productUid)
    logger.info('      • productSerialNumber:', payload.productSerialNumber)
    logger.info('      • productStatusUid:', payload.productStatusUid)
    logger.info('      • manufacturingOrderUid:', payload.manufacturingOrderUid)
    logger.info('      • userUid:', payload.userUid)
    logger.info('      • cycleTime:', payload.cycleTime, 'ms')
    logger.info('      • operationNumber:', payload.operationNumber)
    logger.info('      • machineUid:', payload.machineUid)
    logger.info('      • creationDate:', payload.creationDate)

    if (payload.productUid && payload.productSerialNumber && payload.manufacturingOrderUid) {
      const result = await createProductTraceability(payload)
      logger.info('📥 RÉPONSE:')
      logger.info('   └─ Status HTTP:', result?.status || 'N/A')
      logger.info('   └─ Success:', result?.ok || false)
      logger.info('   └─ Data:', result?.data || null)
      logger.info('')
    } else {
      logger.warn('⚠️  Données incomplètes, traçabilité non créée')
      logger.info('   └─ productUid:', payload.productUid || '(manquant)')
      logger.info('   └─ productSerialNumber:', payload.productSerialNumber || '(manquant)')
      logger.info('   └─ manufacturingOrderUid:', payload.manufacturingOrderUid || '(manquant)')
      logger.info('')
    }
  }
}
