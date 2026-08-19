import { ENDPOINTS } from '../config/apiConfig.js'
import { getJson } from './http.js'

function getValidationDetails(data) {
  if (!data || typeof data !== 'object') return []
  return Object.values(data.errors || {})
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(value => String(value).trim())
    .filter(Boolean)
}

function getApiErrorMessage(status, data) {
  const title = String(data?.title || `Échec de la validation de l’OF (HTTP ${status})`).trim()
  const details = [data?.detail, ...getValidationDetails(data)]
    .map(value => String(value || '').trim())
    .filter(Boolean)
  return details.length ? `${title} — ${details.join(' ')}` : title
}

export function getManufacturingOrderConnectionErrorMessage(error) {
  return error?.name === 'AbortError'
    ? "La validation de l’ordre de fabrication a dépassé le délai prévu."
    : "Impossible de joindre le service de validation de l’ordre de fabrication."
}

export async function validateManufacturingOrder({ productSuffix, serialNumber, manufacturingOrderId } = {}, timeoutMs = 5000) {
  const payload = {
    productSuffix: String(productSuffix ?? ''),
    serialNumber: String(serialNumber ?? ''),
    manufacturingOrderId: String(manufacturingOrderId ?? ''),
  }

  try {
    const { ok, status, data } = await getJson(ENDPOINTS.manufacturingOrderValidate, {
      method: 'POST',
      timeout: timeoutMs,
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!ok) {
      return { ok: false, status, data, errorMessage: getApiErrorMessage(status, data) }
    }

    if (!data || typeof data.isValid !== 'boolean') {
      return {
        ok: false,
        status,
        data,
        errorMessage: "Réponse invalide du service de validation de l’ordre de fabrication.",
      }
    }

    if (!data.isValid) {
      return {
        ok: false,
        status,
        data,
        errorMessage: data.message || "Le produit scanné ne correspond pas à l’ordre de fabrication.",
      }
    }

    return { ok: true, status, data, errorMessage: '' }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: getManufacturingOrderConnectionErrorMessage(error),
    }
  }
}

export default { validateManufacturingOrder }
