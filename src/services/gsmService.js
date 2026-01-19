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

export async function callGsm({ phoneNumber, audioOk }, timeoutMs = 20000) {
  const url = ENDPOINTS.gsmCall
  if (!url) return { ok: false, status: 0, data: null }
  try {
    const res = await request(url, {
      method: 'POST',
      timeout: timeoutMs,
      headers: { accept: '*/*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, audioOk }),
    })
    let data = null
    try {
      data = await res.json()
    } catch (_) {}
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: null }
  }
}

export async function hangupGsm(timeoutMs = 10000) {
  const url = ENDPOINTS.gsmHangup
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
