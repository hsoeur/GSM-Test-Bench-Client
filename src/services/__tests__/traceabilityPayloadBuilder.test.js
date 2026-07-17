import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildProductTraceabilityPayload } from '../traceabilityPayloadBuilder.js'

describe('buildProductTraceabilityPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T08:30:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds the API payload with normalized string fields', () => {
    const payload = buildProductTraceabilityPayload({
      product: {
        productUid: 123,
        serialLabel: 456,
        ofUid: 789,
      },
      statusUid: 'OK',
      operator: { userUid: 42 },
      testStartTs: Date.now() - 1200,
      currentOperationNumber: 30,
      machineUid: 'MO03A',
      now: new Date('2026-07-17T08:30:00.000Z'),
    })

    expect(payload).toEqual({
      productUid: '123',
      productSerialNumber: '456',
      productStatusUid: 'OK',
      creationDate: '2026-07-17T08:30:00.000Z',
      manufacturingOrderUid: '789',
      userUid: '42',
      cycleTime: '1200',
      operationNumber: '30',
      machineUid: 'MO03A',
    })
  })

  it('uses empty strings for missing optional values', () => {
    const payload = buildProductTraceabilityPayload()

    expect(payload.productUid).toBe('')
    expect(payload.productSerialNumber).toBe('')
    expect(payload.manufacturingOrderUid).toBe('')
    expect(payload.userUid).toBe('')
    expect(payload.cycleTime).toBe('')
    expect(payload.operationNumber).toBe('')
  })
})
