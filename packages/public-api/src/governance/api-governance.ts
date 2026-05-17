export type ApiPolicy = { apiKeyRequired: boolean; rateLimitPerMinute: number; audited: boolean }
export const defaultApiPolicy: ApiPolicy = { apiKeyRequired: true, rateLimitPerMinute: 120, audited: true }
