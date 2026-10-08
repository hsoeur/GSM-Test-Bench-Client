import { beforeEach, describe, expect, it, vi } from 'vitest'
import runtimeConfig from '../../../public/config/runtime-config.json'

const { getJsonMock } = vi.hoisted(() => ({ getJsonMock: vi.fn() }))
vi.mock('../http.js', () => ({ getJson: getJsonMock }))

describe('manufacturingOrderSynchronizationService', () => {
  beforeEach(() => getJsonMock.mockReset())

  it('calls the synchronization endpoint for the scanned manufacturing order', async () => {
    getJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        manufacturingOrderId: 26356,
        isSynchronized: true,
        hasQuantityDesynchronization: false,
        hasSerialNumberDesynchronization: false,
        quantity: null,
        serialNumber: null,
        message: "L'ordre de fabrication est synchronisé.",
      },
    })
    const { getManufacturingOrderSynchronization } = await import('../manufacturingOrderSynchronizationService.js')

    const result = await getManufacturingOrderSynchronization('26356')

    expect(result.ok).toBe(true)
    expect(result.errorMessage).toBe('')
    expect(getJsonMock).toHaveBeenCalledWith(
      `${runtimeConfig.apiBases.MO}/api/ManufacturingOrders/26356/synchronization`,
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    )
  })

  it('returns the API message and values when the order is desynchronized', async () => {
    getJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        isSynchronized: false,
        hasQuantityDesynchronization: true,
        hasSerialNumberDesynchronization: true,
        quantity: { oldValue: '1344', newValue: '225' },
        serialNumber: { oldValue: '260440', newValue: '258199' },
        message: "L'ordre de fabrication est désynchronisé au niveau de la quantité et du numéro de série.",
      },
    })
    const { getManufacturingOrderSynchronization } = await import('../manufacturingOrderSynchronizationService.js')

    const result = await getManufacturingOrderSynchronization(26356)

    expect(result).toMatchObject({
      ok: true,
      errorMessage: "L'ordre de fabrication est désynchronisé au niveau de la quantité et du numéro de série.",
      data: {
        isSynchronized: false,
        quantity: { oldValue: '1344', newValue: '225' },
        serialNumber: { oldValue: '260440', newValue: '258199' },
      },
    })
  })

  it('fails closed when the API response is invalid', async () => {
    getJsonMock.mockResolvedValue({ ok: true, status: 200, data: {} })
    const { getManufacturingOrderSynchronization } = await import('../manufacturingOrderSynchronizationService.js')

    await expect(getManufacturingOrderSynchronization(26356)).resolves.toMatchObject({
      ok: false,
      errorMessage: "Réponse invalide du service de synchronisation de l’ordre de fabrication.",
    })
  })

  it('surfaces ProblemDetails and connection failures', async () => {
    const { getManufacturingOrderSynchronization } = await import('../manufacturingOrderSynchronizationService.js')
    getJsonMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      data: { title: 'Ordre de fabrication introuvable', detail: 'Aucun ordre ne correspond.' },
    })
    getJsonMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(getManufacturingOrderSynchronization(26356)).resolves.toMatchObject({
      ok: false,
      status: 404,
      errorMessage: 'Ordre de fabrication introuvable — Aucun ordre ne correspond.',
    })
    await expect(getManufacturingOrderSynchronization(26356)).resolves.toMatchObject({
      ok: false,
      status: 0,
      errorMessage: "Impossible de vérifier la synchronisation de l’ordre de fabrication.",
    })
  })
})
