import { emitIntelligenceTelemetry } from "../telemetry/graph-telemetry"

export type TrendSignal = { key: string; value: number; timestamp: string }

export class TrendAnalyzer {
  detect(tenantId: string, signals: TrendSignal[]) {
    const trendScore = signals.reduce((acc, s) => acc + s.value, 0) / Math.max(signals.length, 1)
    emitIntelligenceTelemetry({ tenantId, category: "trend", action: "trend_detected", score: trendScore, metadata: { signals: signals.length } })
    return { trendScore, signals }
  }
}
