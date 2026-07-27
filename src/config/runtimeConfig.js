import { assertValidRuntimeConfig, RuntimeConfigValidationError } from './runtimeConfigValidator.js'

let runtimeConfig = import.meta.env.MODE === 'test'
  ? globalThis.__TEST_RUNTIME_CONFIG__ ?? null
  : null

export async function loadRuntimeConfig() {
  const url = `/config/runtime-config.json?t=${Date.now()}`
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const loadedConfig = await response.json()
    assertValidRuntimeConfig(loadedConfig)
    runtimeConfig = loadedConfig
  } catch (error) {
    runtimeConfig = null
    throw error instanceof RuntimeConfigValidationError
      ? error
      : new RuntimeConfigValidationError([`Impossible de charger /config/runtime-config.json (${error?.message || error}).`])
  }
  if (typeof window !== 'undefined') {
    window.__RUNTIME_CONFIG__ = runtimeConfig
  }
  return runtimeConfig
}

export function getRuntimeConfig() {
  if (!runtimeConfig) {
    throw new RuntimeConfigValidationError(['La configuration runtime n’est pas chargée.'])
  }
  return runtimeConfig
}

export function getApiBases() {
  return getRuntimeConfig().apiBases
}

export function getProductStatusUids() {
  return getRuntimeConfig().productStatusUids
}

export function getMachineUid() {
  return getRuntimeConfig().machineUid
}

export function getApiStatusConfig() {
  return getRuntimeConfig().apiStatus
}

export function getLoggingConfig() {
  return getRuntimeConfig().logging
}

export function getTestSequenceConfig() {
  return getRuntimeConfig().testSequences
}

export function getPrintLabelConfig(productUid) {
  return getRuntimeConfig().printLabels?.byProduct?.[productUid] || null
}
