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
})
