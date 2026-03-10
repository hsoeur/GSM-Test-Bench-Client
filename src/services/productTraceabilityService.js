import { ENDPOINTS } from '../config/apiConfig.js'
import { request, getJson } from './http.js'

// ⚠️ DEPRECATED: This function is no longer used. Use getLatestProductTraceability instead.
// export async function hasPreviousOperationOkStatus(productUid, serialNumber, currentOperationNumber) {
//   if (!productUid || !serialNumber) return { ok: false, status: 400, value: null }
//   const url = typeof ENDPOINTS.productTraceabilityHasPrevOk === 'function'
//     ? ENDPOINTS.productTraceabilityHasPrevOk({ productUid, serialNumber, currentOperationNumber })
//     : ENDPOINTS.productTraceabilityHasPrevOk
//   const { ok, status, data } = await getJson(url, {
//     headers: { accept: 'application/json' },
//     timeout: 5000,
//   })
//   // Interpret response robustly: boolean, { value }, or string "true"/"false"
//   let value = null
//   if (typeof data === 'boolean') {
//     value = data
//   } else if (data && typeof data === 'object') {
//     if (typeof data.value === 'boolean') value = data.value
//     else if (typeof data.okStatus === 'boolean') value = data.okStatus
//   } else if (typeof data === 'string') {
//     value = String(data).trim().toLowerCase() === 'true'
//   }
//   const message = typeof data === 'string' ? data : ''
//   return { ok, status, value, message }
// }

export async function createProductTraceability(payload) {
  const url = ENDPOINTS.productTraceabilityCreate
  if (!url || !payload) return { ok: false, status: 400 }
  const res = await request(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 5000,
  })
  return { ok: res.ok, status: res.status }
}

export async function getLatestProductTraceability(productUid, serialNumber, operationUid) {
  if (!productUid || !serialNumber || operationUid == null) return { ok: false, status: 400, data: null }
  const url = typeof ENDPOINTS.productTraceabilityLatest === 'function'
    ? ENDPOINTS.productTraceabilityLatest({ productUid, serialNumber, operationUid })
    : ENDPOINTS.productTraceabilityLatest
  const { ok, status, data } = await getJson(url, {
    headers: { accept: 'application/json' },
    timeout: 5000,
  })
  return { ok, status, data }
}

export default { createProductTraceability, getLatestProductTraceability }
