import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

export async function getManufacturingOrderByUid(uid) {
  if (!uid) return { ok: false, status: 400, data: null }
  const url = typeof ENDPOINTS.manufacturingOrderByUid === 'function'
    ? ENDPOINTS.manufacturingOrderByUid(uid)
    : ENDPOINTS.manufacturingOrderByUid
  const { ok, status, data } = await getJson(url, {
    headers: { accept: 'application/json' },
    timeout: 5000,
  })
  return { ok, status, data }
}

export default { getManufacturingOrderByUid }
