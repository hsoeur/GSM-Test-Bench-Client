// Centralized API configuration.
// Base URLs are loaded from /config/runtime-config.json at application startup.

import { getApiBases } from './runtimeConfig.js'

const stripTrailingSlash = (s) => (s && s.endsWith('/') ? s.slice(0, -1) : s)
const join = (base, path) => {
  const b = stripTrailingSlash(base || '')
  const p = path?.startsWith('/') ? path : `/${path || ''}`
  // If no base is provided, return a relative path to support Vite proxy
  return b ? `${b}${p}` : p
}

const configuredBases = getApiBases()

export const API_BASES = {
  TEST_GSM: configuredBases.TEST_GSM,
  DATA: configuredBases.DATA,
  MO: configuredBases.MO,
  PRINT: configuredBases.PRINT,
}

export const ENDPOINTS = {
  gsmHealth: join(API_BASES.TEST_GSM, 'api/Gsm/health'),
  gsmInit: join(API_BASES.TEST_GSM, 'api/Gsm/init-4g'),
  gsmCall: join(API_BASES.TEST_GSM, 'api/Gsm/call'),
  gsmHangup: join(API_BASES.TEST_GSM, 'api/Gsm/hangup'),
  gsmMachine: join(API_BASES.TEST_GSM, 'api/Machine'),
  dataApiHealth: join(API_BASES.DATA, 'api/Healths/Live'),
  dataDbHealth: join(API_BASES.DATA, 'api/Healths/Database'),
  
  // New endpoint for Manufacturing Order by UID
  // Previously: api/ManufacturingOrder/GetManufacturingOrderByManufacturingOrderUid
  // Now:       api/ManufacturingOrders/by-manufacturing-order-uid
  manufacturingOrderByUid: (uid) => join(
    API_BASES.MO,
    `api/ManufacturingOrders/by-manufacturing-order-uid?manufacturingOrderUid=${encodeURIComponent(uid || '')}`,
  ),
  manufacturingOrderSynchronization: (manufacturingOrderId) => join(
    API_BASES.MO,
    `api/ManufacturingOrders/${encodeURIComponent(manufacturingOrderId ?? '')}/synchronization`,
  ),
  manufacturingOrderValidate: join(API_BASES.MO, 'api/ManufacturingOrders/validate'),
  
  // ⚠️ DEPRECATED: Product Traceability N-1 check (no longer used)
  // Previously: api/ProductTraceability/HasPreviousOperationOkStatus
  // Now using: productTraceabilityLatest with previousOperationUid from test sequence
  // productTraceabilityHasPrevOk: ({ productUid, serialNumber, currentOperationNumber } = {}) =>
  //   join(
  //     API_BASES.MO,
  //     `api/ProductTraceabilities/has-previous-operation-ok-status?productUid=${encodeURIComponent(productUid || '')}&serialNumber=${encodeURIComponent(serialNumber || '')}&currentOperationNumber=${encodeURIComponent(currentOperationNumber ?? '')}`,
  //   ),
  
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
  // Now:       api/Operations/basic-by-product-uid
  operationsByProductUid: (productUid) => join(
    API_BASES.MO,
    `api/Operations/basic-by-product-uid?productUid=${encodeURIComponent(productUid || '')}`,
  ),
  // Operators
  operatorsCurrent: join(API_BASES.MO, 'api/Users/current'),
  // Sim cards
  // Previously: api/SimCard/GetCollectionSimCards
  // Now:       api/SimCards/all
  simCards: join(API_BASES.MO, 'api/SimCards/all'),
  
  // Kit Traceability (Mother/Daughter product association)
  // POST api/KitTraceabilities/create
  kitTraceabilityCreate: join(API_BASES.MO, 'api/KitTraceabilities/create'),

  // Print jobs are routed server-side from machineName to a network printer.
  printJobs: join(API_BASES.PRINT, 'api/Print/jobs'),
}

export default { API_BASES, ENDPOINTS }
