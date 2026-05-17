export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function now() { return new Date().toISOString() }

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = { ts: now(), level, message, ...meta }
  try {
    // Keep output JSON to integrate with structured logging systems
    // Use console as sink; production can replace this module with an adapter
    console.log(JSON.stringify(payload))
  } catch (e) {
    // Fallback to plain logging
    // eslint-disable-next-line no-console
    console.error('[logger] failed to stringify log', message, meta, e)
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
}

export default logger
