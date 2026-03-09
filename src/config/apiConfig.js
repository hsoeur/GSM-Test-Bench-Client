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
  // Hardcoded bases (no env). Update here if backends move.
  TEST_GSM: withTrailingSlash('http://localhost:5001'),
  DATA: withTrailingSlash('http://127.0.0.1:5258'),
  MO: withTrailingSlash('http://127.0.0.1:5258'),
}

export const ENDPOINTS = {
  gsmHealth: join(API_BASES.TEST_GSM, 'api/Gsm/health'),
  gsmInit: join(API_BASES.TEST_GSM, 'api/Gsm/init'),
  gsmCall: join(API_BASES.TEST_GSM, 'api/Gsm/call'),
  gsmHangup: join(API_BASES.TEST_GSM, 'api/Gsm/hangup'),
  dataApiHealth: join(API_BASES.DATA, 'api/Health/Live'),
  dataDbHealth: join(API_BASES.DATA, 'api/Health/Database'),
  
  // New endpoint for Manufacturing Order by UID
  // Previously: api/ManufacturingOrder/GetManufacturingOrderByManufacturingOrderUid
  // Now:       api/ManufacturingOrder/by-manufacturing-order-uid
  manufacturingOrderByUid: (uid) => join(
    API_BASES.MO,
    `api/ManufacturingOrder/by-manufacturing-order-uid?manufacturingOrderUid=${encodeURIComponent(uid || '')}`,
  ),
  // Product Traceability N-1 check
  // Previously: api/ProductTraceability/HasPreviousOperationOkStatus
  // Now:       api/ProductTraceabilities/has-previous-operation-ok-status
  productTraceabilityHasPrevOk: ({ productUid, serialNumber, currentOperationNumber } = {}) =>
    join(
      API_BASES.MO,
      `api/ProductTraceabilities/has-previous-operation-ok-status?productUid=${encodeURIComponent(productUid || '')}&serialNumber=${encodeURIComponent(serialNumber || '')}&currentOperationNumber=${encodeURIComponent(currentOperationNumber ?? '')}`,
    ),
  // Product Traceability
  // Previously: api/ProductTraceability/CreateProductTraceability
  // Now:       api/ProductTraceabilities/create
  productTraceabilityCreate: join(API_BASES.MO, 'api/ProductTraceabilities/create'),
  // Get latest product traceability by product, serial number and operation
  productTraceabilityLatest: ({ productUid, serialNumber, operationUid } = {}) =>
    join(
      API_BASES.MO,
      `api/ProductTraceabilities/latest-by-product-serial-and-operation?product=${encodeURIComponent(productUid || '')}&serialNumber=${encodeURIComponent(serialNumber || '')}&operationUid=${encodeURIComponent(operationUid ?? '')}`,
    ),
  // New operations endpoint for a product UID
  // Previously: api/Operation/GetCollectionOperationBasic
  // Now:       api/Operation/basic-by-product-uid
  operationsByProductUid: (productUid) => join(
    API_BASES.MO,
    `api/Operation/basic-by-product-uid?productUid=${encodeURIComponent(productUid || '')}`,
  ),
  // Operators
  operatorsCurrent: join(API_BASES.MO, 'api/Users/current'),
  // Sim cards
  // Previously: api/SimCard/GetCollectionSimCards
  // Now:       api/SimCards/all
  simCards: join(API_BASES.MO, 'api/SimCards/all'),
}

export default { API_BASES, ENDPOINTS }
