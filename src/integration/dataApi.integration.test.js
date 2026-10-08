import process from 'node:process'
import { beforeAll, describe, expect, it } from 'vitest'
import { ENDPOINTS, API_BASES } from '../config/apiConfig.js'
import { getJson } from '../services/http.js'
import { checkDataHealth } from '../services/healthService.js'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { getManufacturingOrderSynchronization } from '../services/manufacturingOrderSynchronizationService.js'
import { validateManufacturingOrder } from '../services/manufacturingOrderValidationService.js'
import { getOperationsByProductUid } from '../services/operationService.js'
import { getCurrentOperators } from '../services/operatorService.js'
import { getSimCards } from '../services/simCardService.js'
import { createProductTraceability, getLatestProductTraceability } from '../services/productTraceabilityService.js'
import { createKitTraceability } from '../services/kitTraceabilityService.js'
import { logger } from '../services/loggerService.js'

const base = API_BASES.DATA.replace(/\/$/, '')
const runId = `TESTGSM-IT-${Date.now()}`
let fixture

async function apiGet(path) {
  return getJson(`${base}${path}`, { timeout: 10000, headers: { accept: 'application/json' } })
}

function expectJsonObject(result, expectedStatus = 200) {
  expect(result.status).toBe(expectedStatus)
  expect(result.ok).toBe(true)
  expect(result.data).toBeTruthy()
  expect(typeof result.data).toBe('object')
}

beforeAll(async () => {
  // The test data is discovered from the real database, not fabricated or mocked.
  const [ordersResult, usersResult, machinesResult] = await Promise.all([
    apiGet('/api/ManufacturingOrders/all'),
    apiGet('/api/Users/current'),
    apiGet('/api/Machines/all'),
  ])

  expect(ordersResult.status).toBe(200)
  expect(Array.isArray(ordersResult.data)).toBe(true)
  expect(ordersResult.data.length).toBeGreaterThan(0)
  expect(usersResult.status).toBe(200)
  expect(Array.isArray(usersResult.data)).toBe(true)
  expect(usersResult.data.length).toBeGreaterThan(0)
  expect(machinesResult.status).toBe(200)
  expect(Array.isArray(machinesResult.data)).toBe(true)
  expect(machinesResult.data.length).toBeGreaterThan(0)

  const preferredOrderUid = process.env.TEST_MANUFACTURING_ORDER_UID
  const order = preferredOrderUid
    ? ordersResult.data.find(item => String(item.manufacturingOrderUid) === preferredOrderUid)
    : ordersResult.data.find(item => item.quantity > 0 && item.productUid)

  expect(order, 'Aucun OF réel exploitable trouvé').toBeTruthy()
  const operationsResult = await apiGet(`/api/Operations/basic-by-product-uid?productUid=${encodeURIComponent(order.productUid)}`)
  expect(operationsResult.status).toBe(200)
  expect(Array.isArray(operationsResult.data)).toBe(true)
  expect(operationsResult.data.length).toBeGreaterThan(0)

  fixture = {
    order,
    user: usersResult.data[0],
    machine: machinesResult.data.find(item => item.machineUid === process.env.TEST_MACHINE_UID) || machinesResult.data[0],
    operation: operationsResult.data[0],
  }

  logger.info('[Integration API Data] Jeu de données réel sélectionné', {
    runId,
    manufacturingOrderUid: fixture.order.manufacturingOrderUid,
    productUid: fixture.order.productUid,
    serialNumber: fixture.order.firstSerialNumber,
    userUid: fixture.user.userUid,
    machineUid: fixture.machine.machineUid,
    operationUid: fixture.operation.operationUid,
    operationNumber: fixture.operation.operationNumber,
  })
})

describe('API Data réelle — endpoints consommés par TestGsm', () => {
  it('GET Health/Live et Health/Database valide l’API et sa base', async () => {
    const [live, database, aggregate] = await Promise.all([
      apiGet('/api/Healths/Live'),
      apiGet('/api/Healths/Database'),
      checkDataHealth(10000),
    ])
    expectJsonObject(live)
    expect(live.data.api).toBe(true)
    expectJsonObject(database)
    expect(database.data.database).toBe(true)
    expect(aggregate).toMatchObject({ state: 'ok', details: { api: true, database: true } })
  })

  it('GET ManufacturingOrders/by-manufacturing-order-uid retourne le bon OF réel', async () => {
    const result = await getManufacturingOrderByUid(fixture.order.manufacturingOrderUid)
    expectJsonObject(result)
    expect(result.data).toMatchObject({
      manufacturingOrderUid: fixture.order.manufacturingOrderUid,
      productUid: fixture.order.productUid,
    })
  })

  it('GET ManufacturingOrders/{id}/synchronization retourne un état exploitable', async () => {
    const result = await getManufacturingOrderSynchronization(fixture.order.manufacturingOrderUid, 10000)
    expectJsonObject(result)
    expect(result.data.manufacturingOrderId).toBe(fixture.order.manufacturingOrderUid)
    expect(result.data.isSynchronized).toBeTypeOf('boolean')
    expect(result.data.hasQuantityDesynchronization).toBeTypeOf('boolean')
    expect(result.data.hasSerialNumberDesynchronization).toBeTypeOf('boolean')
    expect(result.data.message).toBeTypeOf('string')
  })

  it('POST ManufacturingOrders/validate valide le produit et la plage série réels', async () => {
    const order = fixture.order
    const result = await validateManufacturingOrder({
      productSuffix: String(order.productUid).slice(-6),
      serialNumber: String(order.firstSerialNumber).padStart(6, '0'),
      manufacturingOrderId: String(order.manufacturingOrderUid).padStart(5, '0'),
    }, 10000)
    expectJsonObject(result)
    expect(result.data).toMatchObject({
      isValid: true,
      productMatches: true,
      serialNumberInRange: true,
      manufacturingOrderId: order.manufacturingOrderUid,
    })
  })

  it('GET Operations/basic-by-product-uid retourne des opérations cohérentes', async () => {
    const result = await getOperationsByProductUid(fixture.order.productUid)
    expect(result.status).toBe(200)
    expect(result.data.length).toBeGreaterThan(0)
    result.data.forEach(operation => {
      expect(operation.productUid).toBe(fixture.order.productUid)
      expect(operation.operationUid).toBeTruthy()
      expect(Number.isInteger(operation.operationNumber)).toBe(true)
    })
  })

  it('GET Users/current retourne de vrais opérateurs actifs', async () => {
    const result = await getCurrentOperators(10000)
    expect(result.status).toBe(200)
    expect(result.data.length).toBeGreaterThan(0)
    result.data.forEach(user => {
      expect(user.userUid).toBeTruthy()
      expect(user.lastName).toBeTypeOf('string')
      expect(user.firstName).toBeTypeOf('string')
    })
  })

  it('GET SimCards/all retourne des cartes SIM persistées valides', async () => {
    const result = await getSimCards(10000)
    expect(result.status).toBe(200)
    expect(result.data.length).toBeGreaterThan(0)
    result.data.forEach(sim => {
      expect(sim.simCardUid).toBeTruthy()
      expect(sim.simCardNumber).toBeTruthy()
      expect(sim.provider).toBeTruthy()
    })
  })

  it('POST ProductTraceabilities/create puis GET latest relit la trace créée', async () => {
    const serial = fixture.order.firstSerialNumber
    const payload = {
      productUid: fixture.order.productUid,
      productSerialNumber: serial,
      productStatusUid: 'OK',
      failureComment: runId,
      creationDate: new Date().toISOString(),
      manufacturingOrderUid: fixture.order.manufacturingOrderUid,
      userUid: fixture.user.userUid,
      cycleTime: 0,
      operationNumber: fixture.operation.operationNumber,
      machineUid: fixture.machine.machineUid,
    }
    const created = await createProductTraceability(payload)
    expectJsonObject(created)
    expect(created.data.productTraceabilityUid).toBeTruthy()
    expect(created.data.failureComment).toBe(runId)

    const latest = await getLatestProductTraceability(
      payload.productUid,
      payload.productSerialNumber,
      payload.operationNumber,
    )
    expectJsonObject(latest)
    expect(latest.data.productTraceabilityUid).toBe(created.data.productTraceabilityUid)
  })

  it('POST KitTraceabilities/create puis GET by-product-serial relit le kit créé', async () => {
    const uniqueKitSerial = 1_500_000_000 + (Date.now() % 500_000_000)
    const result = await createKitTraceability({
      clientOrder: fixture.order.externalOrderNumber,
      manufacturingOrderUid: fixture.order.manufacturingOrderUid,
      product: fixture.order.productUid,
      horizonComponentCode: runId,
      serialNumber: uniqueKitSerial,
      scanFrame: runId,
      date: new Date().toISOString(),
      userUid: fixture.user.userUid,
    })
    expectJsonObject(result)
    expect(result.data.kitTraceabilityUid).toBeTruthy()
    expect(result.data.scanFrame).toBe(runId)
    expect(result.data.serialNumber).toBe(uniqueKitSerial)

    const persisted = await apiGet(
      `/api/KitTraceabilities/by-product-serial?Product=${encodeURIComponent(result.data.product)}`
      + `&SerialNumber=${encodeURIComponent(result.data.serialNumber)}`,
    )
    expectJsonObject(persisted)
    expect(persisted.data.kitTraceabilityUid).toBe(result.data.kitTraceabilityUid)
    expect(persisted.data.scanFrame).toBe(runId)
  })
})

describe('API Data réelle — validation des erreurs HTTP', () => {
  it('refuse les paramètres obligatoires absents', async () => {
    const checks = await Promise.all([
      apiGet('/api/ManufacturingOrders/by-manufacturing-order-uid'),
      apiGet('/api/Operations/basic-by-product-uid'),
      apiGet('/api/ProductTraceabilities/latest-by-product-serial-and-operation'),
    ])
    checks.forEach(result => {
      expect(result.ok).toBe(false)
      expect(result.status).toBe(400)
      expect(result.data).toBeTruthy()
    })
  })
})
