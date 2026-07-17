export class RuntimeConfigValidationError extends Error {
  constructor(errors) {
    super(`Configuration runtime invalide: ${errors.join('; ')}`)
    this.name = 'RuntimeConfigValidationError'
    this.errors = errors
  }
}

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0
const hasUnresolvedPlaceholder = (value) => typeof value === 'string' && /\$\{[^}]+}/.test(value)
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0

const REQUIRED_STRING_PATHS = [
  ['apiBases', 'TEST_GSM'],
  ['apiBases', 'DATA'],
  ['apiBases', 'MO'],
  ['apiBases', 'PRINT'],
  ['productStatusUids', 'OK'],
  ['productStatusUids', 'KO'],
  ['machineUid'],
]

const getAtPath = (value, path) => path.reduce((current, key) => current?.[key], value)

export function validateRuntimeConfig(config) {
  const errors = []

  if (!isPlainObject(config)) {
    return ['La configuration doit être un objet JSON.']
  }

  for (const path of REQUIRED_STRING_PATHS) {
    const pathLabel = path.join('.')
    if (!isNonEmptyString(getAtPath(config, path))) {
      errors.push(`${pathLabel} est obligatoire et doit être une chaîne non vide.`)
    } else if (hasUnresolvedPlaceholder(getAtPath(config, path))) {
      errors.push(`${pathLabel} contient une variable d’environnement non substituée.`)
    }
  }

  if (!isPlainObject(config.apiStatus)) {
    errors.push('apiStatus doit être un objet.')
  } else {
    if (!isPositiveNumber(config.apiStatus.pollIntervalMs)) {
      errors.push('apiStatus.pollIntervalMs doit être un nombre positif.')
    }
    if (!isPositiveNumber(config.apiStatus.timeoutMs)) {
      errors.push('apiStatus.timeoutMs doit être un nombre positif.')
    }
    if (typeof config.apiStatus.debug !== 'boolean') {
      errors.push('apiStatus.debug doit être un booléen.')
    }
  }

  if (!isPlainObject(config.logging)) {
    errors.push('logging doit être un objet.')
  } else {
    const allowedLevels = ['debug', 'info', 'warn', 'error', 'silent']
    if (!allowedLevels.includes(config.logging.level)) {
      errors.push(`logging.level doit valoir ${allowedLevels.join(', ')}.`)
    }
    if (typeof config.logging.http !== 'boolean') {
      errors.push('logging.http doit être un booléen.')
    }
  }

  if (!isPlainObject(config.testSequences)) {
    errors.push('testSequences doit être un objet.')
  } else {
    if (!isNonEmptyString(config.testSequences.default)) {
      errors.push('testSequences.default doit être une chaîne non vide.')
    }
    if (!isPlainObject(config.testSequences.byProduct)) {
      errors.push('testSequences.byProduct doit être un objet.')
    } else {
      for (const [productUid, fileName] of Object.entries(config.testSequences.byProduct)) {
        if (!isNonEmptyString(productUid) || !isNonEmptyString(fileName)) {
          errors.push('testSequences.byProduct doit contenir des clés et fichiers non vides.')
          break
        }
      }
    }
  }

  if (config.printLabels != null) {
    if (!isPlainObject(config.printLabels?.byProduct)) {
      errors.push('printLabels.byProduct doit être un objet lorsqu’il est fourni.')
    } else {
      for (const [sourceProductUid, labelConfig] of Object.entries(config.printLabels.byProduct)) {
        if (!isNonEmptyString(sourceProductUid) || !isNonEmptyString(labelConfig?.productUid)) {
          errors.push('printLabels.byProduct doit contenir des productUid non vides.')
          break
        }
      }
    }
  }

  return errors
}

export function assertValidRuntimeConfig(config) {
  const errors = validateRuntimeConfig(config)
  if (errors.length > 0) {
    throw new RuntimeConfigValidationError(errors)
  }
}
