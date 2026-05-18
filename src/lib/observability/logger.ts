type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  correlationId?: string
  service?: string
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV === "development"

function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "lummy-web",
    ...context,
  }

  if (isDev) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, context)
  } else {
    // Structured JSON for log aggregation (Vercel, Datadog, etc.)
    console[level === "debug" ? "log" : level](JSON.stringify(entry))
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),

  withContext(base: Record<string, unknown>) {
    return {
      debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, { ...base, ...ctx }),
      info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, { ...base, ...ctx }),
      warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, { ...base, ...ctx }),
      error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, { ...base, ...ctx }),
    }
  },
}
