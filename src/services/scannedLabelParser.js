export function parseScannedProductLabel(value) {
  const raw = String(value)
  const rawParts = raw.split(';')
  const parts = rawParts.map((p) => p.trim())
  // The API contract makes a trailing space in the six-character suffix significant.
  const productField = (rawParts[0] || '').replace(/^\s+/, '')

  return {
    raw,
    productSuffix: productField.slice(-6),
    serialNumber: parts[1] || '',
    manufacturingOrderUid: parts[2] || '',
    parts,
  }
}
