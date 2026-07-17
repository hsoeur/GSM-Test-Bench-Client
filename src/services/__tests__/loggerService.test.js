import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('loggerService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not write info logs when default level is warn', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { logger } = await import('../loggerService.js')

    logger.info('hidden')

    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('writes warnings when default level is warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { logger } = await import('../loggerService.js')

    logger.warn('visible')

    expect(warnSpy).toHaveBeenCalledWith('visible')
  })

  it('keeps HTTP logging disabled by default', async () => {
    const { isHttpLoggingEnabled } = await import('../loggerService.js')

    expect(isHttpLoggingEnabled()).toBe(false)
  })
})
