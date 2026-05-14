export interface TraceContext { traceId: string; correlationId: string; causationId?: string|null }
export class TracingService { child(ctx: TraceContext, causationId: string){ return { traceId: ctx.traceId, correlationId: ctx.correlationId, causationId } } }
