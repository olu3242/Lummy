import { emitOptimizationTelemetry } from "../telemetry/optimization-telemetry"

export class ConversionExperimentManager {
  evaluate(tenantId: string, experimentId: string, controlRate: number, variantRate: number) {
    const lift = variantRate - controlRate
    emitOptimizationTelemetry({ tenantId, experimentId, metric: "ab_test", value: lift, metadata: { controlRate, variantRate } })
    return { lift, winner: lift > 0 ? "variant" : "control" }
  }
}
