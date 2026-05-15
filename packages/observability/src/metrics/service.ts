export interface Gauge { key: string; value: number; tags?: Record<string,string> }
export class MetricsService { private gauges: Gauge[]=[]; record(g: Gauge){ this.gauges.push(g) } list(){ return this.gauges } }
