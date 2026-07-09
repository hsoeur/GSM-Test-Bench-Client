const DEFAULT_RUNTIME_CONFIG = {
  apiBases: {
    TEST_GSM: '/gsm-api',
    DATA: '/data-api',
    MO: '/mo-api',
    PRINT: '/print-api',
  },
  productStatusUids: {
    OK: 'OK',
    KO: 'NOK',
  },
  machineUid: 'MO03A',
  apiStatus: {
    pollIntervalMs: 10000,
    timeoutMs: 4000,
    debug: false,
  },
  testSequences: {
    default: 'testSequence-default.json',
    byProduct: {
      '61PT00567A': 'testSequence-61PT00567A.json',
      '61PT00571A': 'testSequence-61PT00571A.json',
      '61PT00505F': 'testSequence-61PT00505F.json',
      '71PT00634A': 'testSequence-71PT00634A.json',
      '71PT00640A': 'testSequence-71PT00640A.json',
      '71PT00641': 'testSequence-71PT00641.json',
      '71PT00643A': 'testSequence-71PT00643A.json',
    },
  },
  printLabels: {
    byProduct: {
      '71PT00634A': { productUid: '51PT00634A', usageSuffix: 'TKE' },
      '71PT00640A': { productUid: '51PT00640A', usageSuffix: 'TKE V2' },
      '71PT00641': { productUid: '51PT00641', usageSuffix: 'AMP' },
      '71PT00643A': { productUid: '51PT00643A', usageSuffix: 'AMP V2' },
    },
  },
}

let runtimeConfig = DEFAULT_RUNTIME_CONFIG

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

const mergeConfig = (base, override) => {
  if (!isPlainObject(override)) return base
  return Object.entries(override).reduce((acc, [key, value]) => {
    if (isPlainObject(value) && isPlainObject(acc[key])) {
      acc[key] = mergeConfig(acc[key], value)
    } else if (value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, { ...base })
}

export async function loadRuntimeConfig() {
  const url = `/config/runtime-config.json?t=${Date.now()}`
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const loadedConfig = await response.json()
    runtimeConfig = mergeConfig(DEFAULT_RUNTIME_CONFIG, loadedConfig)
  } catch (error) {
    runtimeConfig = DEFAULT_RUNTIME_CONFIG
    console.warn('[runtime-config] Fallback to default config:', error?.message || error)
  }
  window.__RUNTIME_CONFIG__ = runtimeConfig
  return runtimeConfig
}

export function getRuntimeConfig() {
  return runtimeConfig
}

export function getApiBases() {
  return getRuntimeConfig().apiBases || DEFAULT_RUNTIME_CONFIG.apiBases
}

export function getProductStatusUids() {
  return getRuntimeConfig().productStatusUids || DEFAULT_RUNTIME_CONFIG.productStatusUids
}

export function getMachineUid() {
  return getRuntimeConfig().machineUid || DEFAULT_RUNTIME_CONFIG.machineUid
}

export function getApiStatusConfig() {
  return getRuntimeConfig().apiStatus || DEFAULT_RUNTIME_CONFIG.apiStatus
}

export function getTestSequenceConfig() {
  return getRuntimeConfig().testSequences || DEFAULT_RUNTIME_CONFIG.testSequences
}

export function getPrintLabelConfig(productUid) {
  return getRuntimeConfig().printLabels?.byProduct?.[productUid] || null
}

export { DEFAULT_RUNTIME_CONFIG }
