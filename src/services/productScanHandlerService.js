import { logger } from './loggerService.js'
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

  logger.info(LINE)
  logger.info('📦 SCAN PRODUIT')
  logger.info(LINE)
  logger.info('🏷️  Étiquette scannée:', parsedLabel.raw)
  logger.info('🔢 Numéro de série:', parsedLabel.serialNumber)
  logger.info('📋 OF:', parsedLabel.manufacturingOrderUid)
  logger.info('')

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
