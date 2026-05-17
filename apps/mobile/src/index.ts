export class OfflineSyncEngine { enqueue(job:{id:string;tenantId:string}){ return job; } sync(){ return { synced:true, at:new Date().toISOString() }; } }
export class NotificationOrchestrator { schedulePush(target:string, message:string){ return { target, message, queued:true }; } }
export class MobileTelemetryAdapter { emit(event:string, traceId:string){ return { event, traceId }; } }
export class MobileRuntimeBridge { openAssistant(sessionId:string){ return { sessionId, entrypoint:'ai-assistant' as const }; } }
