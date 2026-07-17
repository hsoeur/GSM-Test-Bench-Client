import { logger } from './loggerService.js'
import { getPrintLabelConfig } from '../config/runtimeConfig.js'
import { printBySerialNumber } from './printService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function printConfiguredLabelsForProduct(sourceProductUid, scannedProduct) {
  const printLabelConfig = getPrintLabelConfig(sourceProductUid)
  if (!printLabelConfig || !scannedProduct) {
    return { skipped: true, results: [] }
  }

  const usageSuffix = printLabelConfig.usageSuffix || ''
  const printParams = {
    manufacturingOrderUid: scannedProduct.ofUid,
    productUid: printLabelConfig.productUid,
    serialNumber: scannedProduct.serialLabel,
  }

  logger.info(LINE)
  logger.info(`🖨️  IMPRESSION ÉTIQUETTES — ${sourceProductUid}`)
  logger.info(LINE)

  const portalUsage = `Gateway Montage Portail ASM ${usageSuffix}`
  logger.info(`🖨️  [1/2] Impression étiquette Portail ASM (${portalUsage})`)
  const portalResult = await printBySerialNumber({ ...printParams, uidUsage: portalUsage })
  logger.info('   └─ Status HTTP:', portalResult.status, '| OK:', portalResult.ok)

  const designationUsage = `Gateway Montage Mac ${usageSuffix}`
  logger.info(`🖨️  [2/2] Impression étiquette Désignation (${designationUsage})`)
  const designationResult = await printBySerialNumber({ ...printParams, uidUsage: designationUsage })
  logger.info('   └─ Status HTTP:', designationResult.status, '| OK:', designationResult.ok)

  logger.info(LINE)
  logger.info('')

  return {
    skipped: false,
    results: [portalResult, designationResult],
  }
}
