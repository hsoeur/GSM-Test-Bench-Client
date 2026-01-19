import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

export async function getOperationsByProductUid(productUid) {
  if (!productUid) return { ok: false, status: 400, data: null }
  const url = typeof ENDPOINTS.operationsByProductUid === 'function'
    ? ENDPOINTS.operationsByProductUid(productUid)
    : ENDPOINTS.operationsByProductUid
  const { ok, status, data } = await getJson(url, {
    headers: { accept: 'text/plain' },
    timeout: 5000,
  })
  return { ok, status, data }
}

export default { getOperationsByProductUid }
