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
  } catch (error) {
    void error
    return { state: 'ko' }
  }
}

export async function checkDataHealth(timeoutMs = 4000) {
  const apiUrl = ENDPOINTS.dataApiHealth
  const dbUrl = ENDPOINTS.dataDbHealth
  if (!apiUrl && !dbUrl) return { state: 'na' }
  try {
    const [apiRes, dbRes] = await Promise.all([
      apiUrl ? getJson(apiUrl, { timeout: timeoutMs }) : Promise.resolve({ ok: false, data: null }),
      dbUrl ? getJson(dbUrl, { timeout: timeoutMs }) : Promise.resolve({ ok: false, data: null }),
    ])

    const apiOk = !!(apiRes.ok && apiRes.data?.api)
    const dbOk = !!(dbRes.ok && dbRes.data?.database)

    return {
      // État principal basé sur la santé API (comme convenu)
      state: apiOk ? 'ok' : 'ko',
      details: {
        api: apiOk,
        database: dbOk,
      },
    }
  } catch (error) {
    void error
    return { state: 'ko' }
  }
}
