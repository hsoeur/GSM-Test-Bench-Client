import { getManufacturingOrderByUid } from './manufacturingOrderService.js'
import { createKitTraceability } from './kitTraceabilityService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

const isMotherDaughterPair = (productsToTrace) =>
  productsToTrace.length === 2 && productsToTrace[0].productUid !== productsToTrace[1].productUid

export async function submitKitTraceabilityIfNeeded({ status, productsToTrace = [], operator } = {}) {
  if (status === 'OK' && isMotherDaughterPair(productsToTrace)) {
    console.log(LINE)
    console.log('👩‍👧 DÉTECTION COUPLE MERE/FILLE')
    console.log(LINE)
    console.log('🔍 Produit 1 (Mère):', productsToTrace[0].productUid, '- SN:', productsToTrace[0].serialLabel)
    console.log('🔍 Produit 2 (Fille):', productsToTrace[1].productUid, '- SN:', productsToTrace[1].serialLabel)
    console.log('')

    try {
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
    }

    console.log(LINE)
    console.log('')
    return
  }

  if (isMotherDaughterPair(productsToTrace)) {
    console.log('⚠️  Couple Mère/Fille détecté mais carte MAUVAISE (KO) - KitTraceability NON enregistré')
    console.log('')
  } else if (productsToTrace.length === 1) {
    console.log('ℹ️  Produit simple détecté (pas de couple Mère/Fille)')
    console.log('')
  } else if (productsToTrace.length > 2) {
    console.log('⚠️  Plus de 2 produits scannés - Pas d\'association Mère/Fille')
    console.log('')
  }
}
