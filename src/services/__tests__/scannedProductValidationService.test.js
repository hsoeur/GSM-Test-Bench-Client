import { beforeEach, describe, expect, it, vi } from 'vitest'

const { validateManufacturingOrderMock, getLatestProductTraceabilityMock } = vi.hoisted(() => ({
  validateManufacturingOrderMock: vi.fn(),
  getLatestProductTraceabilityMock: vi.fn(),
}))

vi.mock('../manufacturingOrderValidationService.js', () => ({
  validateManufacturingOrder: validateManufacturingOrderMock,
}))
vi.mock('../productTraceabilityService.js', () => ({
  getLatestProductTraceability: getLatestProductTraceabilityMock,
}))

const parsedLabel = {
  raw: '71PT00634A;123456;12345',
  productSuffix: '00634A',
  serialNumber: '123456',
  manufacturingOrderUid: '12345',
}

describe('scannedProductValidationService', () => {
  beforeEach(() => {
    validateManufacturingOrderMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      data: { isValid: true, productUid: '71PT00634A', manufacturingOrderId: 12345 },
    })
    getLatestProductTraceabilityMock.mockReset().mockResolvedValue({ ok: false, status: 404, data: null })
  })

  it('validates the scanned product before checking traceability', async () => {
    const { validateScannedProduct } = await import('../scannedProductValidationService.js')

    const result = await validateScannedProduct({
      parsedLabel,
      stepId: 'scan-label',
      testSequence: { testSequence: [{ id: 'scan-label', actionConfig: {} }] },
      productUid: '71PT00634A',
      manufacturingOrderUid: '99999',
      currentOperationNumber: 10,
      okStatusUid: 'OK',
    })

    expect(validateManufacturingOrderMock).toHaveBeenCalledWith({
      productSuffix: '00634A',
      serialNumber: '123456',
      manufacturingOrderId: '12345',
    })
    expect(result).toMatchObject({
      type: 'valid',
      scannedProduct: { serialLabel: '123456', ofUid: '99999' },
    })
  })

  it('blocks the scan and preserves the API message when validation fails', async () => {
    validateManufacturingOrderMock.mockResolvedValue({
      ok: false,
      status: 200,
      data: { isValid: false },
      errorMessage: "Le numéro de série n'appartient pas à la plage de l'OF.",
    })
    const { validateScannedProduct } = await import('../scannedProductValidationService.js')

    const result = await validateScannedProduct({ parsedLabel })

    expect(result).toEqual({
      type: 'error',
      errorMessage: "Le numéro de série n'appartient pas à la plage de l'OF.",
    })
    expect(getLatestProductTraceabilityMock).not.toHaveBeenCalled()
  })
})
