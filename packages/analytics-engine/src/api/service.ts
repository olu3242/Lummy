import { MetricsQueryService } from "../metrics/query-service"
export class AnalyticsApiService { constructor(private readonly metrics: MetricsQueryService) {} getMetric(tenantId: string, metricKey: string) { return this.metrics.latest(tenantId, metricKey) } }
