import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearMachineName, detectMachineName, getMachineName, initializeMachineFromUrl, setMachineName } from '../machineService.js'

const { getJsonMock } = vi.hoisted(() => ({ getJsonMock: vi.fn() }))
vi.mock('../http.js', () => ({ getJson: getJsonMock }))

describe('machineService', () => {
  beforeEach(() => {
    getJsonMock.mockReset()
    const values = new Map()
    const localStorage = {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => values.set(key, value)),
      removeItem: vi.fn((key) => values.delete(key)),
    }
    vi.stubGlobal('window', { localStorage, location: { search: '' } })
  })

  it('persists a normalized machine name', () => {
    expect(setMachineName('  PC-PROD-03  ')).toBe('PC-PROD-03')
    expect(getMachineName()).toBe('PC-PROD-03')
  })

  it('uses and persists the machine provided in the URL', () => {
    window.location.search = '?machine=PC-PROD-04'
    expect(initializeMachineFromUrl()).toBe('PC-PROD-04')
    expect(getMachineName()).toBe('PC-PROD-04')
  })

  it('clears the configured machine', () => {
    setMachineName('PC-PROD-03')
    clearMachineName()
    expect(getMachineName()).toBeNull()
  })

  it('detects the machine name from the local Test GSM API', async () => {
    getJsonMock.mockResolvedValue({ ok: true, data: { machineName: ' PC-PROD-03 ' } })

    await expect(detectMachineName()).resolves.toBe('PC-PROD-03')
    expect(getJsonMock).toHaveBeenCalledWith('/gsm-api/api/Machine', { timeout: 4000 })
  })

  it('returns null when automatic detection is unavailable', async () => {
    getJsonMock.mockRejectedValue(new Error('offline'))
    await expect(detectMachineName()).resolves.toBeNull()
  })
})
