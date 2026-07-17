import { beforeEach, describe, expect, it, vi } from 'vitest'

const callGsmMock = vi.fn()
const hangupGsmMock = vi.fn()

vi.mock('../gsmService.js', () => ({
  callGsm: callGsmMock,
  hangupGsm: hangupGsmMock,
}))

const { hangupGsmAudioCheck, startGsmAudioCheck } = await import('../productGsmStepService.js')

describe('productGsmStepService', () => {
  beforeEach(() => {
    callGsmMock.mockReset()
    hangupGsmMock.mockReset()
  })

  it('rejects GSM audio check when phone number is missing', () => {
    const onStatusChange = vi.fn()

    const result = startGsmAudioCheck({ phoneNumber: '', onStatusChange })

    expect(result.ok).toBe(false)
    expect(result.errorMessage).toContain('numéro de téléphone manquant')
    expect(onStatusChange).toHaveBeenCalledWith('error')
    expect(callGsmMock).not.toHaveBeenCalled()
  })

  it('starts GSM call and reports connected when call succeeds', async () => {
    const onStatusChange = vi.fn()
    callGsmMock.mockResolvedValue({ ok: true })

    const result = startGsmAudioCheck({ phoneNumber: '0600000000', onStatusChange })
    await vi.waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('connected'))

    expect(result).toEqual({ ok: true })
    expect(onStatusChange).toHaveBeenNthCalledWith(1, 'calling')
    expect(callGsmMock).toHaveBeenCalledWith({ phoneNumber: '0600000000', audioOk: true })
  })

  it('hangs up the GSM audio check', async () => {
    hangupGsmMock.mockResolvedValue({ ok: true })

    await hangupGsmAudioCheck()

    expect(hangupGsmMock).toHaveBeenCalledTimes(1)
  })
})
