import { printConfiguredLabelsForProduct } from './labelPrintingService.js'

export async function submitOkTraceabilityAndPrintLabels({
  productUid,
  scannedProduct,
  submitTraceability,
} = {}) {
  await submitTraceability('OK')
  await printConfiguredLabelsForProduct(productUid, scannedProduct)
}
