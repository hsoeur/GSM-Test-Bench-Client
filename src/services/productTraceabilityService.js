import { ENDPOINTS } from '../config/apiConfig.js'
import { request } from './http.js'

export async function hasPreviousOperationOkStatus(productUid, serialNumber, currentOperationNumber = 55) {
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
  return { ok: res.ok, status: res.status, value }
}

export default { hasPreviousOperationOkStatus }
