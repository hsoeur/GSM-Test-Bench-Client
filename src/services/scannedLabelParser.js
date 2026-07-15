export function parseScannedProductLabel(value) {
  const raw = String(value)
  const parts = raw.split(';').map((p) => p.trim())

  return {
    raw,
    serialNumber: parts[1] || '',
    manufacturingOrderUid: parts[2] || '',
    parts,
  }
}
