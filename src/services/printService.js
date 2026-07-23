import { ENDPOINTS } from '../config/apiConfig'
import { request } from './http'

/**
 * Print a label by serial number
 * @param {object} params
 * @param {string} params.jobId
 * @param {string} params.machineName
 * @param {string|number} params.manufacturingOrderUid
 * @param {string} params.productUid
 * @param {string} params.uidUsage
 * @param {string|number} params.serialNumber
 * @param {number} [timeoutMs]
 */
export async function printBySerialNumber(params, timeoutMs = 10000) {
  try {
    const res = await request(ENDPOINTS.printJobs, {
      method: 'POST',
      timeout: timeoutMs,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(params),
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
