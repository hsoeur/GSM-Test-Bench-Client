import { ENDPOINTS } from '../config/apiConfig.js'
import { request } from './http.js'

export async function hasPreviousOperationOkStatus(productUid, serialNumber, currentOperationNumber) {
  if (!productUid || !serialNumber) return { ok: false, status: 400, value: null }
  const url = typeof ENDPOINTS.productTraceabilityHasPrevOk === 'function'
    ? ENDPOINTS.productTraceabilityHasPrevOk({ productUid, serialNumber, currentOperationNumber })
    : ENDPOINTS.productTraceabilityHasPrevOk
  const res = await request(url, {
    method: 'GET',
    headers: { accept: 'text/plain' },
    timeout: 5000,
  })
  let text = null
  try {
    text = await res.text()
  } catch (_) {}
  const value = String(text).trim().toLowerCase() === 'true'
  return { ok: res.ok, status: res.status, value, message: (text || '').trim() }
}

export async function createProductTraceability(payload) {
  const url = ENDPOINTS.productTraceabilityCreate
  if (!url || !payload) return { ok: false, status: 400 }
  const res = await request(url, {
    method: 'POST',
    headers: { accept: 'text/plain', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 5000,
  })
  return { ok: res.ok, status: res.status }
}

export default { hasPreviousOperationOkStatus, createProductTraceability }
