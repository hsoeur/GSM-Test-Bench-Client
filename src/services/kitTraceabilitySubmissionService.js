import { logger } from './loggerService.js'
import { getManufacturingOrderByUid } from './manufacturingOrderService.js'
import { createKitTraceability } from './kitTraceabilityService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

const isMotherDaughterPair = (productsToTrace) =>
  productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid

export async function submitKitTraceabilityIfNeeded({ status, productsToTrace = [], operator } = {}) {
  if (status === 'OK' && isMotherDaughterPair(productsToTrace)) {
    logger.info(LINE)
    logger.info('👩‍👧 DÉTECTION COUPLE MERE/FILLE')
    logger.info(LINE)
    logger.info('🔍 Produit 1 (Mère):', productsToTrace[0].productUid, '- SN:', productsToTrace[0].serialLabel)
    logger.info('🔍 Produit 2 (Fille):', productsToTrace[1].productUid, '- SN:', productsToTrace[1].serialLabel)
    logger.info('')

    try {
      const motherProduct = productsToTrace[0]
      const daughterProduct = productsToTrace[1]

      logger.info('🌐 API CALL - getManufacturingOrderByUid (pour clientOrder)')
      logger.info('   └─ manufacturingOrderUid:', motherProduct.ofUid)

      const { ok: moOk, data: moData } = await getManufacturingOrderByUid(motherProduct.ofUid)

      logger.info('📥 RÉPONSE:')
      logger.info('   └─ Success:', moOk)
      logger.info('   └─ Data:', moData)
      logger.info('')

      const clientOrder = moOk && moData ? String(moData.externalOrderNumber || 'UNKNOWN_ORDER') : 'UNKNOWN_ORDER'

      const kitPayload = {
        kitTraceabilityUid: '',
        clientOrder,
        manufacturingOrderUid: Number(motherProduct.ofUid),
        product: String(motherProduct.productUid),
        horizonComponentCode: String(daughterProduct.productUid),
        serialNumber: Number(motherProduct.serialLabel || 0),
        scanFrame: String(daughterProduct.labelScan || ''),
        date: new Date().toISOString(),
        userUid: operator ? String(operator.userUid) : '',
      }

      logger.info('🌐 API CALL - createKitTraceability')
      logger.info('   └─ Endpoint: /api/KitTraceability/create')
      logger.info('   └─ Payload:')
      logger.info('      • clientOrder:', kitPayload.clientOrder)
      logger.info('      • manufacturingOrderUid:', kitPayload.manufacturingOrderUid)
      logger.info('      • product (Mère):', kitPayload.product)
      logger.info('      • horizonComponentCode (Fille):', kitPayload.horizonComponentCode)
      logger.info('      • serialNumber:', kitPayload.serialNumber)
      logger.info('      • scanFrame:', kitPayload.scanFrame)
      logger.info('      • date:', kitPayload.date)
      logger.info('      • userUid:', kitPayload.userUid)
      logger.info('')

      const kitResult = await createKitTraceability(kitPayload)

      logger.info('📥 RÉPONSE:')
      logger.info('   └─ Status HTTP:', kitResult?.status || 'N/A')
      logger.info('   └─ Success:', kitResult?.ok || false)
      logger.info('   └─ Data:', kitResult?.data || null)
      logger.info('')

      if (kitResult.ok) {
        logger.info('✅ Association Mère/Fille enregistrée avec succès')
      } else {
        logger.warn('⚠️  Échec enregistrement association Mère/Fille - Status:', kitResult.status)
      }
    } catch (kitErr) {
      logger.error('❌ ERREUR lors de l\'enregistrement de l\'association Mère/Fille')
      logger.error('   └─', kitErr)
    }

    logger.info(LINE)
    logger.info('')
    return
  }

  if (isMotherDaughterPair(productsToTrace)) {
    logger.info('⚠️  Couple Mère/Fille détecté mais carte MAUVAISE (KO) - KitTraceability NON enregistré')
    logger.info('')
  } else if (productsToTrace.length === 1) {
    logger.info('ℹ️  Produit simple détecté (pas de couple Mère/Fille)')
    logger.info('')
  } else if (productsToTrace.length > 2) {
    logger.info('⚠️  Plus de 2 produits scannés - Pas d\'association Mère/Fille')
    logger.info('')
  }
}
