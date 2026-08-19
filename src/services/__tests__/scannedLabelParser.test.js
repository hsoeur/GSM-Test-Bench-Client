import { describe, expect, it } from 'vitest'
import { parseScannedProductLabel } from '../scannedLabelParser.js'

describe('parseScannedProductLabel', () => {
  it('extracts serial number and manufacturing order uid from a scanned label', () => {
    const result = parseScannedProductLabel('71PT00634A;123456;12345;suffix')

    expect(result).toEqual({
      raw: '71PT00634A;123456;12345;suffix',
      productSuffix: '00634A',
      serialNumber: '123456',
      manufacturingOrderUid: '12345',
      parts: ['71PT00634A', '123456', '12345', 'suffix'],
    })
  })

  it('preserves a significant trailing space in the product suffix', () => {
    const result = parseScannedProductLabel('71PT00641 ;123456;12345')
    expect(result.productSuffix).toBe('00641 ')
  })

  it('returns empty fields when label is incomplete', () => {
    const result = parseScannedProductLabel('only-prefix')

    expect(result.serialNumber).toBe('')
    expect(result.manufacturingOrderUid).toBe('')
    expect(result.productSuffix).toBe('prefix')
  })
})
