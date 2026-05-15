export class TelemetryService { enforce(skillId: string) { return { skillId, domain: "telemetry", queue: "skills.telemetry" } } }
