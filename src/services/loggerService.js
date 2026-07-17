import { getLoggingConfig } from '../config/runtimeConfig.js'

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
}

const normalizeLevel = (level) => (LEVELS[level] ? level : 'warn')

function shouldLog(level) {
  const config = getLoggingConfig()
  const currentLevel = normalizeLevel(config?.level)
  return LEVELS[level] >= LEVELS[currentLevel]
}

function write(level, args) {
  if (!shouldLog(level)) return
  const target = console[level] || console.log
  target(...args)
}

export function isHttpLoggingEnabled() {
  return Boolean(getLoggingConfig()?.http)
}

export const logger = {
  debug: (...args) => write('debug', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  group: (...args) => {
    if (shouldLog('info')) console.group(...args)
  },
  groupEnd: () => {
    if (shouldLog('info')) console.groupEnd()
  },
}
