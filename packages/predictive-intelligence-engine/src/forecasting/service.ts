export class ForecastingService { forecast(tenantId: string) { return { tenantId, queue: "predictions.generate", explainable: true } } }
