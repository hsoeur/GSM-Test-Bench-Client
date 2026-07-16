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

    console.log(`🌐 API CALL - createProductTraceability [Produit ${i + 1}/${productsToTraceFiltered.length}]${motherDaughterPair ? ' (Mère uniquement)' : ''}`)
    console.log('   └─ Endpoint: /api/ProductTraceability')

    const payload = buildProductTraceabilityPayload({
      product,
      statusUid,
      operator,
      testStartTs,
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
}
