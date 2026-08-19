import { beforeEach, describe, expect, it, vi } from 'vitest'
import runtimeConfig from '../../../public/config/runtime-config.json'

const requestMock = vi.fn()

vi.mock('../http.js', () => ({ request: requestMock }))

describe('printService', () => {
  beforeEach(() => requestMock.mockReset())

  it('posts a print job as JSON', async () => {
    requestMock.mockResolvedValue({ ok: true, status: 202, json: async () => ({ jobUid: 'JOB-1' }) })
    const { printBySerialNumber } = await import('../printService.js')
    const payload = { jobId: 'JOB-1', machineName: 'PC-PROD-03', serialNumber: 'SN-1' }

    await expect(printBySerialNumber(payload)).resolves.toEqual({
      ok: true,
      status: 202,
      data: { jobUid: 'JOB-1' },
    })
    expect(requestMock).toHaveBeenCalledWith(`${runtimeConfig.apiBases.PRINT}/api/Print/jobs`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }))
  })

  it('throws the ProblemDetails returned by the API', async () => {
    requestMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({
        title: 'Poste inconnu',
        detail: "Aucune imprimante n'est configurée pour le poste 'PC-INCONNU'.",
        status: 404,
      }),
    })
    const { printBySerialNumber } = await import('../printService.js')

    await expect(printBySerialNumber({ machineName: 'PC-INCONNU' })).rejects.toMatchObject({
      name: 'PrintJobError',
      title: 'Poste inconnu',
      detail: "Aucune imprimante n'est configurée pour le poste 'PC-INCONNU'.",
      status: 404,
    })
  })

  it('preserves a non-JSON error response', async () => {
    requestMock.mockResolvedValue({ ok: false, status: 503, text: async () => 'Imprimante hors ligne' })
    const { printBySerialNumber } = await import('../printService.js')

    await expect(printBySerialNumber({})).rejects.toThrow(
      'Erreur d’impression (HTTP 503) — Imprimante hors ligne',
    )
  })

  it('reports a timeout with a user-facing message', async () => {
    const { createConnectionPrintError } = await import('../printService.js')

    const error = createConnectionPrintError({ name: 'AbortError', message: 'aborted' })
    expect(error.name).toBe('PrintJobError')
    expect(error.message).toBe("Délai d’impression dépassé — Le service d’impression n’a pas répondu dans le délai prévu.")
    expect(error.status).toBe(0)
  })

  it('reports a network failure with a user-facing message', async () => {
    const { createConnectionPrintError } = await import('../printService.js')

    const error = createConnectionPrintError(new TypeError('Failed to fetch'))
    expect(error.name).toBe('PrintJobError')
    expect(error.message).toBe("Service d’impression inaccessible — Impossible de joindre le service d’impression. Vérifiez la connexion puis réessayez.")
    expect(error.status).toBe(0)
  })
})
