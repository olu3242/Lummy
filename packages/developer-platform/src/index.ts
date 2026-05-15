import { ApiGatewayService, ApiKeyService, PartnerGovernanceService } from "@lummy/ecosystem-api"
import { FeatureFlagGovernanceService } from "@lummy/feature-flags"
export class DeveloperPlatformService { constructor(private readonly gateway: ApiGatewayService, private readonly keys: ApiKeyService, private readonly governance: PartnerGovernanceService, private readonly flags = new FeatureFlagGovernanceService()) {} }
