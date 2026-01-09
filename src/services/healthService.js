import { ENDPOINTS } from '../config/apiConfig'
import { getJson } from './http'

export async function checkGsmHealth(timeoutMs = 4000) {
  const url = ENDPOINTS.gsmHealth
  if (!url) return { state: 'na' }
  try {
    const { ok, data } = await getJson(url, { timeout: timeoutMs })
    if (!ok) return { state: 'ko' }
    return {
      state: data?.api ? 'ok' : 'ko',
      details: {
        api: !!data?.api,
        portOpen: !!data?.portOpen,
        modemOk: !!data?.modemOk,
      },
    }
  } catch (e) {
    return { state: 'ko' }
  }
}

export async function checkDataHealth(timeoutMs = 4000) {
  const url = ENDPOINTS.dataHealth
  if (!url) return { state: 'na' }
  try {
    const { ok, data } = await getJson(url, { timeout: timeoutMs })
    if (!ok) return { state: 'ko' }
    return {
      state: data?.api ? 'ok' : 'ko',
      details: {
        api: !!data?.api,
        database: !!data?.database,
      },
    }
  } catch (e) {
    return { state: 'ko' }
  }
}
