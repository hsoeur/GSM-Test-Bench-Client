import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

export async function getSimCards(timeoutMs = 5000) {
  const url = ENDPOINTS.simCards
  if (!url) return { ok: false, status: 0, data: [] }
  try {
    const { ok, status, data } = await getJson(url, {
      headers: { accept: 'application/json' },
      timeout: timeoutMs,
    })
    const list = Array.isArray(data) ? data : []
    // Optional sort: provider then simCardNumber for usability
    list.sort((a, b) => {
      const pr = (a?.provider || '').localeCompare(b?.provider || '', 'fr', { sensitivity: 'base' })
      if (pr !== 0) return pr
      return (a?.simCardNumber || '').localeCompare(b?.simCardNumber || '', 'fr', { numeric: true, sensitivity: 'base' })
    })
    return { ok, status, data: list }
  } catch (_) {
    return { ok: false, status: 0, data: [] }
  }
}

export function toSimOption(sim) {
  if (!sim) return { value: '', label: '' }
  const uid = String(sim.uid || '')
  const num = String(sim.simCardNumber || '').trim()
  const provider = String(sim.provider || '').trim()
  const phone = String(sim.phoneNumber || '').trim()
  const parts = [num || uid, provider, phone].filter(Boolean)
  return { value: uid, label: parts.join(' — ') }
}

export default { getSimCards, toSimOption }
