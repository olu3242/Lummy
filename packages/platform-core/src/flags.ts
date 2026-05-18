export type FeatureFlagKey =
  | "FF_PLATFORM_CORE_V1"
  | "FF_EVENTS_OUTBOX_WRITE"
  | "FF_REPOSITORY_LAYER_V1"
  | "FF_AGENT_ORCHESTRATOR_V1"

export interface FeatureFlagEvaluator {
  isEnabled(flag: FeatureFlagKey, tenantId?: string): boolean
}

export class StaticFeatureFlagEvaluator implements FeatureFlagEvaluator {
  constructor(private readonly enabled = new Set<FeatureFlagKey>()) {}
  isEnabled(flag: FeatureFlagKey): boolean {
    return this.enabled.has(flag)
  }
}
