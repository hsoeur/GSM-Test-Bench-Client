import { ENDPOINTS } from '../config/apiConfig'
import { request } from './http'

export class PrintJobError extends Error {
  constructor(message, { title = 'Erreur d’impression', detail = '', status = 0 } = {}) {
    super(message)
    this.name = 'PrintJobError'
    this.title = title
    this.detail = detail
    this.status = status
    this.isPrintJobError = true
  }
}

function buildErrorMessage(title, detail) {
  if (title && detail) return `${title} — ${detail}`
  return detail || title || 'L’impression a échoué.'
}

async function readResponseBody(response) {
  if (typeof response.text === 'function') {
    const text = await response.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch (error) {
      void error
      return text
    }
  }

  if (typeof response.json === 'function') {
    try {
      return await response.json()
    } catch (error) {
      void error
    }
  }
  return null
}

function createHttpPrintError(status, data) {
  const problem = data && typeof data === 'object' ? data : null
  const title = String(problem?.title || `Erreur d’impression (HTTP ${status})`)
  const detail = String(problem?.detail || (typeof data === 'string' ? data : '')).trim()
  return new PrintJobError(buildErrorMessage(title, detail), { title, detail, status })
}

export function createConnectionPrintError(error) {
  const timedOut = error?.name === 'AbortError'
  const title = timedOut ? 'Délai d’impression dépassé' : 'Service d’impression inaccessible'
  const detail = timedOut
    ? "Le service d’impression n’a pas répondu dans le délai prévu."
    : "Impossible de joindre le service d’impression. Vérifiez la connexion puis réessayez."
  return new PrintJobError(buildErrorMessage(title, detail), { title, detail, status: 0 })
}

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
  let res
  try {
    res = await request(ENDPOINTS.printJobs, {
      method: 'POST',
      timeout: timeoutMs,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (error) {
    throw createConnectionPrintError(error)
  }

  const data = await readResponseBody(res)
  if (!res.ok) throw createHttpPrintError(res.status, data)
  return { ok: res.ok, status: res.status, data }
}
