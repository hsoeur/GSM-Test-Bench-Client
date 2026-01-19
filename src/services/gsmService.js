import { ENDPOINTS } from '../config/apiConfig'
import { request } from './http'

export async function initGsm(timeoutMs = 4000) {
  const url = ENDPOINTS.gsmInit
  if (!url) return { ok: false, status: 0 }
  try {
    const res = await request(url, {
      method: 'POST',
      timeout: timeoutMs,
      headers: { accept: '*/*' },
      body: '',
    })
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, status: 0 }
  }
}
