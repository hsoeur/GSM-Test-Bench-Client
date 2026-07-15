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

  console.log(LINE)
  console.log(`🖨️  IMPRESSION ÉTIQUETTES — ${sourceProductUid}`)
  console.log(LINE)

  const portalUsage = `Gateway Montage Portail ASM ${usageSuffix}`
  console.log(`🖨️  [1/2] Impression étiquette Portail ASM (${portalUsage})`)
  const portalResult = await printBySerialNumber({ ...printParams, uidUsage: portalUsage })
  console.log('   └─ Status HTTP:', portalResult.status, '| OK:', portalResult.ok)

  const designationUsage = `Gateway Montage Mac ${usageSuffix}`
  console.log(`🖨️  [2/2] Impression étiquette Désignation (${designationUsage})`)
  const designationResult = await printBySerialNumber({ ...printParams, uidUsage: designationUsage })
  console.log('   └─ Status HTTP:', designationResult.status, '| OK:', designationResult.ok)

  console.log(LINE)
  console.log('')

  return {
    skipped: false,
    results: [portalResult, designationResult],
  }
}
