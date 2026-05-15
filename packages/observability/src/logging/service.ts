export class LoggingService { log(level: "info"|"warn"|"error", message: string, fields: Record<string, unknown> = {}) { return { level, message, fields, loggedAt: new Date().toISOString() } } }
