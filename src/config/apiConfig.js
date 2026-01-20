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
  // Hardcoded TEST GSM API base (no .env)
  TEST_GSM: withTrailingSlash('http://localhost:5001'),
  // Hardcoded DATA API base as requested (no .env)
  DATA: withTrailingSlash('http://192.168.1.104:7000'),
  // Hardcoded Manufacturing Order API base (no .env, no '/mo-api')
  MO: withTrailingSlash('http://192.168.1.104:7000'),
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
  productTraceabilityCreate: join(API_BASES.MO, 'api/ProductTraceability/CreateProductTraceability'),
  operationsByProductUid: (productUid) => join(API_BASES.MO, `api/Operation/GetCollectionOperationBasic?productUid=${encodeURIComponent(productUid || '')}`),
  // Operators
  operatorsCurrent: join(API_BASES.MO, 'api/Operator/GetCollectionCurrentOperator'),
  // Sim cards
  simCards: join(API_BASES.MO, 'api/SimCard/GetCollectionSimCards'),
}

export default { API_BASES, ENDPOINTS }
