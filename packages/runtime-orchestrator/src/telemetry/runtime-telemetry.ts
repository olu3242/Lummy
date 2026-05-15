export interface RuntimeMetric { key: string; value: number; queue?: string; workerId?: string; at: string }
export class RuntimeTelemetryService { private readonly metrics: RuntimeMetric[] = []; record(m: Omit<RuntimeMetric,"at">){ this.metrics.push({ ...m, at: new Date().toISOString() }) } list(){ return this.metrics } }
