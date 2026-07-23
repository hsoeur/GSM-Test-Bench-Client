import { logger } from './loggerService.js'
import { getPrintLabelConfig } from '../config/runtimeConfig.js'
import { printBySerialNumber } from './printService.js'
import { getMachineName } from './machineService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function printConfiguredLabelsForProduct(sourceProductUid, scannedProduct) {
  const printLabelConfig = getPrintLabelConfig(sourceProductUid)
  if (!printLabelConfig || !scannedProduct) {
    return { skipped: true, results: [] }
  }

  const usageSuffix = printLabelConfig.usageSuffix || ''
  const machineName = getMachineName()
  if (!machineName) {
    throw new Error('Aucun poste configuré pour l’impression.')
  }
  const printParams = {
    machineName,
    manufacturingOrderUid: scannedProduct.ofUid,
    productUid: printLabelConfig.productUid,
    serialNumber: scannedProduct.serialLabel,
  }

  logger.info(LINE)
  logger.info(`🖨️  IMPRESSION ÉTIQUETTES — ${sourceProductUid}`)
  logger.info(LINE)

  const portalUsage = `Gateway Montage Portail ASM ${usageSuffix}`
  logger.info(`🖨️  [1/2] Impression étiquette Portail ASM (${portalUsage})`)
  const portalResult = await printBySerialNumber({
    ...printParams,
    jobId: createPrintJobId(printParams, portalUsage),
    uidUsage: portalUsage,
  })
  logger.info('   └─ Status HTTP:', portalResult.status, '| OK:', portalResult.ok)

  const designationUsage = `Gateway Montage Mac ${usageSuffix}`
  logger.info(`🖨️  [2/2] Impression étiquette Désignation (${designationUsage})`)
  const designationResult = await printBySerialNumber({
    ...printParams,
    jobId: createPrintJobId(printParams, designationUsage),
    uidUsage: designationUsage,
  })
  logger.info('   └─ Status HTTP:', designationResult.status, '| OK:', designationResult.ok)

  logger.info(LINE)
  logger.info('')

  return {
    skipped: false,
    results: [portalResult, designationResult],
  }
}

function createPrintJobId({ machineName, manufacturingOrderUid, serialNumber }, uidUsage) {
  return [machineName, manufacturingOrderUid, serialNumber, uidUsage]
    .map((value) => String(value).trim().replace(/[^a-zA-Z0-9_-]+/g, '-'))
    .join('-')
}
