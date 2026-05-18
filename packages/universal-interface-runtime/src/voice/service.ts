export class VoiceOrchestrationService { route(sessionId: string) { return { sessionId, queue: "realtime.events" } } }
