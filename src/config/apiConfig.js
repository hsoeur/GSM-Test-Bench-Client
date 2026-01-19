// Centralized API configuration using Vite env variables
// Define base URLs via .env (VITE_*) so components never hardcode endpoints

const withTrailingSlash = (s) => (s && !s.endsWith('/') ? `${s}` : s)
const stripTrailingSlash = (s) => (s && s.endsWith('/') ? s.slice(0, -1) : s)
const join = (base, path) => {
  const b = stripTrailingSlash(base || '')
  const p = path?.startsWith('/') ? path : `/${path || ''}`
  // If no base is provided, return a relative path to support Vite proxy
  return b ? `${b}${p}` : p
}

export const API_BASES = {
  // In dev, defaults use Vite proxy prefixes; override with absolute URLs in env for prod.
  TEST_GSM: withTrailingSlash(import.meta.env.VITE_API_TEST_GSM_BASE || '/gsm-api'),
  DATA: withTrailingSlash(import.meta.env.VITE_API_DATA_BASE || '/data-api'),
  MO: withTrailingSlash(import.meta.env.VITE_API_MO_BASE || '/mo-api'),
}

export const ENDPOINTS = {
  gsmHealth: join(API_BASES.TEST_GSM, 'api/Gsm/health'),
  gsmInit: join(API_BASES.TEST_GSM, 'api/Gsm/init'),
  gsmCall: join(API_BASES.TEST_GSM, 'api/Gsm/call'),
  gsmHangup: join(API_BASES.TEST_GSM, 'api/Gsm/hangup'),
  dataApiHealth: join(API_BASES.DATA, 'api/Health/Live'),
  dataDbHealth: join(API_BASES.DATA, 'api/Health/Database'),
  manufacturingOrderByUid: (uid) => join(API_BASES.MO, `api/ManufacturingOrder/GetManufacturingOrderByManufacturingOrderUid?manufacturingOrderUid=${encodeURIComponent(uid || '')}`),
  productTraceabilityHasPrevOk: ({ productUid, serialNumber, currentOperationNumber } = {}) =>
    join(
      API_BASES.MO,
      `api/ProductTraceability/HasPreviousOperationOkStatus?productUid=${encodeURIComponent(productUid || '')}&serialNumber=${encodeURIComponent(serialNumber || '')}&currentOperationNumber=${encodeURIComponent(currentOperationNumber ?? '')}`,
    ),
  operationsByProductUid: (productUid) => join(API_BASES.MO, `api/Operation/GetCollectionOperationBasic?productUid=${encodeURIComponent(productUid || '')}`),
  // Operators
  operatorsCurrent: join(API_BASES.MO, 'api/Operator/GetCollectionCurrentOperator'),
}

export default { API_BASES, ENDPOINTS }
