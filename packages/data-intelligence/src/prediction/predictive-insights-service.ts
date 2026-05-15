import { emitIntelligenceTelemetry } from "../telemetry/graph-telemetry"

export type PredictiveObservation = { metric: string; current: number; baseline: number }

export class PredictiveInsightsService {
  score(tenantId: string, observations: PredictiveObservation[]) {
    const predictiveScore = observations.reduce((acc, obs) => acc + (obs.current - obs.baseline), 0)
    emitIntelligenceTelemetry({ tenantId, category: "predictive", action: "prediction_scored", score: predictiveScore, metadata: { observations: observations.length } })
    return { predictiveScore, observations }
  }
}
