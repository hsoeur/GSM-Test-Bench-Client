import { describe, expect, it } from 'vitest'
import { parseScannedProductLabel } from '../scannedLabelParser.js'

describe('parseScannedProductLabel', () => {
  it('extracts serial number and manufacturing order uid from a scanned label', () => {
    const result = parseScannedProductLabel('prefix ; SN123 ; OF456 ; suffix')

    expect(result).toEqual({
      raw: 'prefix ; SN123 ; OF456 ; suffix',
      serialNumber: 'SN123',
      manufacturingOrderUid: 'OF456',
      parts: ['prefix', 'SN123', 'OF456', 'suffix'],
    })
  })

  it('returns empty fields when label is incomplete', () => {
    const result = parseScannedProductLabel('only-prefix')

    expect(result.serialNumber).toBe('')
    expect(result.manufacturingOrderUid).toBe('')
  })
})
