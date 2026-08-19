import { beforeEach, describe, expect, it, vi } from 'vitest'
import runtimeConfig from '../../../public/config/runtime-config.json'

const { getJsonMock } = vi.hoisted(() => ({ getJsonMock: vi.fn() }))
vi.mock('../http.js', () => ({ getJson: getJsonMock }))

describe('manufacturingOrderValidationService', () => {
  beforeEach(() => getJsonMock.mockReset())

  it('posts the scan fields without trimming the significant suffix', async () => {
    getJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        isValid: true,
        productMatches: true,
        serialNumberInRange: true,
        manufacturingOrderId: 12345,
        productUid: '71PT00641 ',
        firstSerialNumber: 123400,
        lastSerialNumber: 123499,
        message: 'Valide',
      },
    })
    const { validateManufacturingOrder } = await import('../manufacturingOrderValidationService.js')

    const result = await validateManufacturingOrder({
      productSuffix: '00641 ',
      serialNumber: '123456',
      manufacturingOrderId: '12345',
    })

    expect(result.ok).toBe(true)
    expect(getJsonMock).toHaveBeenCalledWith(
      `${runtimeConfig.apiBases.MO}/api/ManufacturingOrders/validate`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          productSuffix: '00641 ',
          serialNumber: '123456',
          manufacturingOrderId: '12345',
        }),
      }),
    )
  })

  it('returns the business message when the serial number is outside the range', async () => {
    getJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        isValid: false,
        productMatches: true,
        serialNumberInRange: false,
        message: "Le numéro de série n'appartient pas à la plage de l'OF.",
      },
    })
    const { validateManufacturingOrder } = await import('../manufacturingOrderValidationService.js')

    await expect(validateManufacturingOrder({})).resolves.toMatchObject({
      ok: false,
      status: 200,
      errorMessage: "Le numéro de série n'appartient pas à la plage de l'OF.",
    })
  })

  it('combines ValidationProblemDetails messages', async () => {
    getJsonMock.mockResolvedValue({
      ok: false,
      status: 400,
      data: {
        title: 'Erreur de validation',
        errors: {
          SerialNumber: ['Le numéro de série doit contenir exactement 6 chiffres.'],
          ManufacturingOrderId: ["L'identifiant de l'OF doit contenir exactement 5 chiffres."],
        },
      },
    })
    const { validateManufacturingOrder } = await import('../manufacturingOrderValidationService.js')

    const result = await validateManufacturingOrder({})
    expect(result.errorMessage).toContain('Erreur de validation')
    expect(result.errorMessage).toContain('exactement 6 chiffres')
    expect(result.errorMessage).toContain('exactement 5 chiffres')
  })

  it('surfaces ProblemDetails returned for an unknown order', async () => {
    getJsonMock.mockResolvedValue({
      ok: false,
      status: 404,
      data: { title: 'Ordre de fabrication introuvable', detail: 'Aucun ordre de fabrication ne correspond.' },
    })
    const { validateManufacturingOrder } = await import('../manufacturingOrderValidationService.js')

    await expect(validateManufacturingOrder({})).resolves.toMatchObject({
      ok: false,
      status: 404,
      errorMessage: 'Ordre de fabrication introuvable — Aucun ordre de fabrication ne correspond.',
    })
  })

  it('returns a readable message when the API is unreachable', async () => {
    const { getManufacturingOrderConnectionErrorMessage } = await import('../manufacturingOrderValidationService.js')

    expect(getManufacturingOrderConnectionErrorMessage(new TypeError('Failed to fetch'))).toBe(
      "Impossible de joindre le service de validation de l’ordre de fabrication.",
    )
    expect(getManufacturingOrderConnectionErrorMessage({ name: 'AbortError' })).toBe(
      "La validation de l’ordre de fabrication a dépassé le délai prévu.",
    )
  })
})
