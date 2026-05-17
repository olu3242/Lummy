import { AIFallbackEngine } from "./ai-fallback-engine"
import { AICache } from "./ai-cache"
import { CommerceIntelligenceService } from "./commerce-intelligence"
import { CostGovernor } from "./cost-governor"
import { CreatorCopilotService } from "./creator-copilot"
import { FailureHandler } from "./failure-handler"
import { InferenceTelemetry } from "./inference-telemetry"
import { ModelExecutor } from "./model-executor"
import { createDefaultPromptRegistry, PromptOrchestrator } from "./prompt-orchestrator"
import { ProviderRouter } from "./provider-router"
import { AIRateLimiter } from "./safety"
import { ConsoleAIRuntimeStore } from "./store"
import type { AIRuntimeStore } from "./types"
import { AnthropicProvider, OpenAIProvider } from "./providers"

export function createAIRuntime(store: AIRuntimeStore = new ConsoleAIRuntimeStore()) {
  const telemetry = new InferenceTelemetry(store)
  const executor = new ModelExecutor(
    new ProviderRouter([new OpenAIProvider(), new AnthropicProvider()]),
    new PromptOrchestrator(createDefaultPromptRegistry()),
    telemetry,
    new AIFallbackEngine(),
    new CostGovernor(),
    new FailureHandler(1),
    new AIRateLimiter(),
    new AICache()
  )
  return {
    executor,
    telemetry,
    commerce: new CommerceIntelligenceService(executor, store),
    copilot: new CreatorCopilotService(executor, store),
  }
}
