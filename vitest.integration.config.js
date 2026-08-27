import process from 'node:process'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(() => {
  const integrationEnv = loadEnv('integration', process.cwd(), '')
  for (const [name, value] of Object.entries(integrationEnv)) {
    // An explicitly supplied CI or shell variable always has priority.
    if (!process.env[name]) process.env[name] = value
  }

  return {
    test: {
      include: ['src/integration/**/*.integration.test.js'],
      setupFiles: ['./src/integration/setupIntegration.js'],
      reporters: ['verbose'],
      testTimeout: 15000,
      hookTimeout: 30000,
      fileParallelism: false,
      sequence: { concurrent: false },
    },
  }
})
