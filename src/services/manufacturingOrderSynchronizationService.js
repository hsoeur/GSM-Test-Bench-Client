import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

function problemDetailsMessage(status, data) {
  const title = String(data?.title || `Échec de la vérification de synchronisation (HTTP ${status})`).trim()
  const detail = String(data?.detail || '').trim()
  return detail ? `${title} — ${detail}` : title
}

function connectionErrorMessage(error) {
  return error?.name === 'AbortError'
    ? "La vérification de la synchronisation de l’ordre de fabrication a dépassé le délai prévu."
    : "Impossible de vérifier la synchronisation de l’ordre de fabrication."
}

export async function getManufacturingOrderSynchronization(manufacturingOrderId, timeoutMs = 5000) {
  const id = String(manufacturingOrderId ?? '').trim()
  if (!/^\d+$/.test(id)) {
    return {
      ok: false,
      status: 400,
      data: null,
      errorMessage: "L’identifiant de l’ordre de fabrication est invalide.",
    }
  }

  try {
    const { ok, status, data } = await getJson(ENDPOINTS.manufacturingOrderSynchronization(id), {
      timeout: timeoutMs,
      headers: { accept: 'application/json' },
    })

    if (!ok) {
      return { ok: false, status, data, errorMessage: problemDetailsMessage(status, data) }
    }

    if (!data || typeof data.isSynchronized !== 'boolean') {
      return {
        ok: false,
        status,
        data,
        errorMessage: "Réponse invalide du service de synchronisation de l’ordre de fabrication.",
      }
    }

    return {
      ok: true,
      status,
      data,
      errorMessage: data.isSynchronized
        ? ''
        : data.message || "L’ordre de fabrication n’est pas synchronisé avec la GPAO.",
    }
  } catch (error) {
    return { ok: false, status: 0, data: null, errorMessage: connectionErrorMessage(error) }
  }
}

export default { getManufacturingOrderSynchronization }
