export class BuildTelemetryService { capture(cacheHitRate:number,durationMs:number){ return {cacheHitRate,durationMs,instability:durationMs>300000} } }
