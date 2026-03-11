import { ENDPOINTS } from '../config/apiConfig.js'
import { request } from './http.js'

/**
 * Create a Kit Traceability record to associate a mother/daughter product pair
 * @param {Object} payload - The kit traceability data
 * @param {string} payload.kitTraceabilityUid - Auto-generated, pass empty string
 * @param {string} payload.clientOrder - External order number from Manufacturing Order
 * @param {number|string} payload.manufacturingOrderUid - Manufacturing Order UID
 * @param {string} payload.product - Mother product UID (e.g., "61PT00505F")
 * @param {string} payload.horizonComponentCode - Daughter product UID (e.g., "61PT00570D")
 * @param {number|string} payload.serialNumber - Serial number of the mother product
 * @param {string} payload.scanFrame - Scanned label of the daughter product
 * @param {string} payload.date - ISO 8601 date string
 * @param {string} payload.userUid - Operator user UID
 * @returns {Promise<{ok: boolean, status: number, data?: any}>}
 */
export async function createKitTraceability(payload) {
  const url = ENDPOINTS.kitTraceabilityCreate
  if (!url || !payload) return { ok: false, status: 400 }
  
  const res = await request(url, {
    method: 'POST',
    headers: { 
      accept: 'application/json', 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload),
    timeout: 5000,
  })
  
  return { 
    ok: res.ok, 
    status: res.status,
    data: res.data 
  }
}

export default { createKitTraceability }
