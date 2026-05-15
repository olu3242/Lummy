export interface RuntimeStats { queueDepth: number; retries: number; deadLetters: number; workerHealth: number; throughput: number; latencyMs: number; failures: number }
export class RuntimeObservabilityService { private stats: RuntimeStats[]=[]; record(s: RuntimeStats){ this.stats.push(s) } latest(){ return this.stats.at(-1) } }
