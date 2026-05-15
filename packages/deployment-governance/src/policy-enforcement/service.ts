import { FeatureFlagGovernanceService, type FeatureFlag } from "@lummy/feature-flags"
export class PolicyEnforcementService { constructor(private readonly flags = new FeatureFlagGovernanceService()) {} enforceFlag(flag: FeatureFlag) { if (!this.flags.isEnabled(flag)) throw new Error("feature flag disabled") } }
