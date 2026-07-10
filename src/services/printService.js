import { ENDPOINTS } from '../config/apiConfig'
import { request } from './http'

/**
 * Print a label by serial number
 * @param {object} params
 * @param {string|number} params.manufacturingOrderUid
 * @param {string} params.productUid
 * @param {string} params.uidUsage
 * @param {string|number} params.serialNumber
 * @param {number} [timeoutMs]
 */
export async function printBySerialNumber({ manufacturingOrderUid, productUid, uidUsage, serialNumber }, timeoutMs = 10000) {
  const url = ENDPOINTS.printBySerialNumber({ manufacturingOrderUid, productUid, uidUsage, serialNumber })
  try {
    const res = await request(url, {
      method: 'GET',
      timeout: timeoutMs,
      headers: { accept: 'application/json' },
    })
    let data = null
    try {
      data = await res.json()
    } catch (error) {
      void error
    }
    return { ok: res.ok, status: res.status, data }
  } catch (error) {
    void error
    return { ok: false, status: 0, data: null }
  }
}
