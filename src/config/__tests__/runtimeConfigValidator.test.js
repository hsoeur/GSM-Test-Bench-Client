import { describe, expect, it } from 'vitest'
import { RuntimeConfigValidationError, assertValidRuntimeConfig, validateRuntimeConfig } from '../runtimeConfigValidator.js'
import validRuntimeConfig from '../../../public/config/runtime-config.json'

describe('validateRuntimeConfig', () => {
  it('accepts the centralized runtime configuration', () => {
    expect(validateRuntimeConfig(validRuntimeConfig)).toEqual([])
  })

  it('rejects missing mandatory API bases and identifiers', () => {
    const errors = validateRuntimeConfig({
      ...validRuntimeConfig,
      apiBases: {
        ...validRuntimeConfig.apiBases,
        DATA: '',
      },
      productStatusUids: {
        OK: 'OK',
        KO: '',
      },
      machineUid: '',
    })

    expect(errors).toContain('apiBases.DATA est obligatoire et doit être une chaîne non vide.')
    expect(errors).toContain('productStatusUids.KO est obligatoire et doit être une chaîne non vide.')
    expect(errors).toContain('machineUid est obligatoire et doit être une chaîne non vide.')
  })

  it('rejects invalid operational settings', () => {
    const errors = validateRuntimeConfig({
      ...validRuntimeConfig,
      apiStatus: {
        pollIntervalMs: 0,
        timeoutMs: '4000',
        debug: 'false',
      },
      logging: {
        level: 'verbose',
        http: 'false',
      },
    })

    expect(errors).toContain('apiStatus.pollIntervalMs doit être un nombre positif.')
    expect(errors).toContain('apiStatus.timeoutMs doit être un nombre positif.')
    expect(errors).toContain('apiStatus.debug doit être un booléen.')
    expect(errors).toContain('logging.level doit valoir debug, info, warn, error, silent.')
    expect(errors).toContain('logging.http doit être un booléen.')
  })

  it('rejects unresolved environment placeholders', () => {
    const errors = validateRuntimeConfig({
      ...validRuntimeConfig,
      apiBases: {
        ...validRuntimeConfig.apiBases,
        DATA: '${API_DATA_BASE}',
      },
    })

    expect(errors).toContain('apiBases.DATA contient une variable d’environnement non substituée.')
  })

  it('throws a structured error when assertion fails', () => {
    expect(() => assertValidRuntimeConfig(null)).toThrow(RuntimeConfigValidationError)
  })
})
