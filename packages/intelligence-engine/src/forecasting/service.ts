export type ForecastMetric = 'gmv' | 'subscriptions' | 'payouts' | 'campaigns' | 'affiliates' | 'ai_revenue';
export type ForecastRequest = { tenantId: string; metric: ForecastMetric; horizonDays: number; signals: Record<string, number> };
export type ForecastResult = { metric: ForecastMetric; predictedValue: number; confidence: number; generatedAt: string };

export function generateForecast(request: ForecastRequest): ForecastResult {
  const baseline = Object.values(request.signals).reduce((sum, value) => sum + value, 0);
  return { metric: request.metric, predictedValue: baseline * Math.max(1, request.horizonDays / 7), confidence: 0.5, generatedAt: new Date().toISOString() };
}
