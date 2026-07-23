import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

const STORAGE_KEY = 'ui-test-gsm:machineName'

const normalizeMachineName = (value) => String(value ?? '').trim()

export function getMachineName() {
  try {
    return normalizeMachineName(window.localStorage.getItem(STORAGE_KEY)) || null
  } catch (error) {
    void error
    return null
  }
}

export function setMachineName(value) {
  const machineName = normalizeMachineName(value)
  if (!machineName) throw new Error('Le nom du poste est obligatoire.')
  window.localStorage.setItem(STORAGE_KEY, machineName)
  return machineName
}

export function initializeMachineFromUrl() {
  const machineName = normalizeMachineName(new URLSearchParams(window.location.search).get('machine'))
  return machineName ? setMachineName(machineName) : getMachineName()
}

export function clearMachineName() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function detectMachineName(timeoutMs = 4000) {
  try {
    const { ok, data } = await getJson(ENDPOINTS.gsmMachine, { timeout: timeoutMs })
    const machineName = normalizeMachineName(data?.machineName)
    return ok && machineName ? machineName : null
  } catch (error) {
    void error
    return null
  }
}
