export function buildRetestScannedProduct(retestConfirmation) {
  if (!retestConfirmation) return null

  return {
    labelScan: '',
    serialLabel: retestConfirmation.serialLabel,
    ofUid: retestConfirmation.ofUid,
    productUid: retestConfirmation.productUid,
  }
}
