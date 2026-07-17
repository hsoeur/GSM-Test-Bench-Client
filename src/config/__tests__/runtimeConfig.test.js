import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('loadRuntimeConfig', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('window', {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads and exposes a valid merged runtime config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        apiBases: {
          DATA: 'http://data.local',
        },
        productStatusUids: {
          KO: 'KO',
        },
      }),
    }))

    const { loadRuntimeConfig, getApiBases, getProductStatusUids } = await import('../runtimeConfig.js')

    await loadRuntimeConfig()

    expect(getApiBases().DATA).toBe('http://data.local')
    expect(getApiBases().TEST_GSM).toBe('/gsm-api')
    expect(getProductStatusUids().KO).toBe('KO')
    expect(window.__RUNTIME_CONFIG__.apiBases.DATA).toBe('http://data.local')
  })

  it('fails fast when runtime config cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }))

    const { loadRuntimeConfig, getRuntimeConfig } = await import('../runtimeConfig.js')

    await expect(loadRuntimeConfig()).rejects.toMatchObject({
      name: 'RuntimeConfigValidationError',
      errors: ['Impossible de charger /config/runtime-config.json (HTTP 404).'],
    })
    expect(() => getRuntimeConfig()).toThrow('Configuration runtime invalide')
  })

  it('fails fast when merged config is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        apiBases: {
          PRINT: '',
        },
      }),
    }))

    const { loadRuntimeConfig } = await import('../runtimeConfig.js')

    await expect(loadRuntimeConfig()).rejects.toMatchObject({
      name: 'RuntimeConfigValidationError',
      errors: ['apiBases.PRINT est obligatoire et doit être une chaîne non vide.'],
    })
  })
})
