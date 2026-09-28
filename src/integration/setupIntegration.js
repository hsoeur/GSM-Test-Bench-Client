import process from 'node:process'

const baseUrl = String(process.env.DATA_API_BASE_URL || '').replace(/\/$/, '')

if (!baseUrl) {
  throw new Error('DATA_API_BASE_URL doit être défini dans .env.integration ou dans l’environnement.')
}

globalThis.__TEST_RUNTIME_CONFIG__ = {
  apiBases: {
    TEST_GSM: process.env.GSM_API_BASE_URL || 'http://localhost:5001',
    DATA: baseUrl,
    MO: baseUrl,
    PRINT: process.env.PRINT_API_BASE_URL || 'http://localhost:12003',
  },
  productStatusUids: { OK: 'OK', KO: 'NOK' },
  machineUid: process.env.TEST_MACHINE_UID || 'MO03A',
  apiStatus: { pollIntervalMs: 10000, timeoutMs: 10000, debug: false },
  // Integration tests intentionally expose the real HTTP exchanges in the console.
  logging: { level: 'debug', http: true },
  testSequences: { default: 'testSequence-default.json', byProduct: {} },
}

console.info(`[Integration API Data] Cible HTTP : ${baseUrl}`)
