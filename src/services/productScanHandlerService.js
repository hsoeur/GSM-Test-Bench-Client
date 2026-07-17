import { parseScannedProductLabel } from './scannedLabelParser.js'
import { validateScannedProduct } from './scannedProductValidationService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function handleProductScan({
  value,
  stepId,
  testSequence,
  productUid,
  manufacturingOrderUid,
  currentOperationNumber,
  okStatusUid,
} = {}) {
  const parsedLabel = parseScannedProductLabel(value)

  console.log(LINE)
  console.log('📦 SCAN PRODUIT')
  console.log(LINE)
  console.log('🏷️  Étiquette scannée:', parsedLabel.raw)
  console.log('🔢 Numéro de série:', parsedLabel.serialNumber)
  console.log('📋 OF:', parsedLabel.manufacturingOrderUid)
  console.log('')

  return validateScannedProduct({
    parsedLabel,
    stepId,
    testSequence,
    productUid,
    manufacturingOrderUid,
    currentOperationNumber,
    okStatusUid,
  })
}
