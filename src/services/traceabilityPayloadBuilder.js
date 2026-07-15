export function buildProductTraceabilityPayload({
  product,
  statusUid,
  operator,
  testStartTs,
  currentOperationNumber,
  machineUid,
  now = new Date(),
} = {}) {
  return {
    productUid: String(product?.productUid || ''),
    productSerialNumber: String(product?.serialLabel || ''),
    productStatusUid: String(statusUid || ''),
    creationDate: now.toISOString(),
    manufacturingOrderUid: String(product?.ofUid || ''),
    userUid: operator ? String(operator.userUid) : '',
    cycleTime: testStartTs ? String(Date.now() - testStartTs) : '',
    operationNumber: currentOperationNumber != null ? String(currentOperationNumber) : '',
    machineUid: String(machineUid),
  }
}
