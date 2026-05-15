export interface RuntimeConfig {
  appEnv: "development" | "staging" | "production"
  appUrl: string
  telemetryEnabled: boolean
  eventsEnabled: boolean
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const appEnv = (env.NEXT_PUBLIC_APP_ENV || "development") as RuntimeConfig["appEnv"]
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!appUrl.startsWith("http")) throw new Error("NEXT_PUBLIC_APP_URL must be absolute")

  return {
    appEnv,
    appUrl,
    telemetryEnabled: env.LUMMY_TELEMETRY_ENABLED !== "false",
    eventsEnabled: env.LUMMY_EVENTS_ENABLED !== "false",
  }
}
