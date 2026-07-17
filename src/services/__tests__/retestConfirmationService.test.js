import { describe, expect, it } from 'vitest'
import { buildRetestScannedProduct } from '../retestConfirmationService.js'

describe('buildRetestScannedProduct', () => {
  it('maps a retest confirmation to a scanned product', () => {
    expect(buildRetestScannedProduct({
      serialLabel: '12345',
      ofUid: '67890',
      productUid: '71PT00634A',
    })).toEqual({
      labelScan: '',
      serialLabel: '12345',
      ofUid: '67890',
      productUid: '71PT00634A',
    })
  })

  it('returns null when no retest confirmation is provided', () => {
    expect(buildRetestScannedProduct(null)).toBeNull()
  })
})
