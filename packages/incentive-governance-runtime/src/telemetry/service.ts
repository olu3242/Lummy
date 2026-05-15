export class TelemetryService { monitor(programId: string) { return { programId, domain: "telemetry", queue: "incentives.audit" } } }
