import { ENDPOINTS } from '../config/apiConfig'
import { getJson } from './http'

export async function getCurrentOperators(timeoutMs = 5000) {
  const url = ENDPOINTS.operatorsCurrent
  if (!url) return { ok: false, status: 0, data: [] }
  try {
    const { ok, status, data } = await getJson(url, {
      headers: { accept: 'text/plain' },
      timeout: timeoutMs,
    })
    const list = Array.isArray(data) ? data : []
    // Sort by lastName then firstName for easier selection
    list.sort((a, b) => {
      const ln = (a?.lastName || '').localeCompare(b?.lastName || '', 'fr', { sensitivity: 'base' })
      if (ln !== 0) return ln
      return (a?.firstName || '').localeCompare(b?.firstName || '', 'fr', { sensitivity: 'base' })
    })
    return { ok, status, data: list }
  } catch (_) {
    return { ok: false, status: 0, data: [] }
  }
}

export function operatorLabel(op) {
  if (!op) return ''
  const last = op.lastName || ''
  const first = op.firstName || ''
  return `${last} ${first}`.trim()
}
