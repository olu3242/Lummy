export class PredictionService { predict(signal: string) { return { signal, retryQueue: "predictions.retry" } } }
