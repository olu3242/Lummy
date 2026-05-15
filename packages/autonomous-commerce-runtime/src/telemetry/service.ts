export class TelemetryService { execute(tenantId: string, replayKey: string) { return { tenantId, replayKey, step: "telemetry", queue: "commerce.orchestration" } } }
