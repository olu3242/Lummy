# AI Runtime Execution

## Entry Point

All AI inference flows through `src/lib/ai/gateway.ts`. Never instantiate `new Anthropic()` elsewhere.

## Named Agents

| Agent | Role | Model | Use Case |
|---|---|---|---|
| `adaeze` | Commerce Strategist | primary (Sonnet) | Storefront optimization, pricing, conversion funnels |
| `ngozi` | Content Creator | primary (Sonnet) | Captions, product descriptions, marketing copy |
| `chidi` | Analytics & Insights | fast (Haiku) | Metric interpretation, trend analysis |
| `emeka` | Customer Relations | primary (Sonnet) | Customer replies, follow-ups, support messages |
| `taiwo` | Campaign Optimizer | primary (Sonnet) | WhatsApp campaigns, promotions, product launches |
| `amara` | Onboarding Guide | fast (Haiku) | New creator onboarding, store setup guidance |

## Model Registry

```typescript
MODELS = {
  primary:  "claude-sonnet-4-20250514",
  fast:     "claude-haiku-4-5-20251001",
  advanced: "claude-opus-4-7",
}
```

## Request Flow

```
callAgent(GatewayRequest)
  ├─ checkBudget(tenantId)      ← fail if hard cap exceeded
  ├─ withRetry(() => messages.create())  ← 3 attempts, exponential backoff
  ├─ calcCostUsd(tokens)
  ├─ logToDb()                  ← ai_generations (audit)
  └─ recordCost()               ← ai_cost_events + increment ai_usage_budgets
```

## Budget Enforcement

Budget is checked per-tenant per calendar month:
- Reads `ai_usage_budgets` WHERE `period_start = first-of-month`
- `hard_cap=true`: rejects request if projected spend > `budget_usd`
- `alert_threshold`: logs warning when projected spend ≥ threshold%
- Failures are non-blocking (never reject on budget check error)

Cost is recorded via `increment_ai_budget_used` RPC which atomically increments `used_usd`.

## Prompt Caching

Opt-in via `options.enablePromptCaching = true`. When enabled, the system prompt is sent with `cache_control: { type: "ephemeral" }` for Anthropic prompt caching. Cache hit/miss tokens are tracked separately and priced at reduced rates.

## Convenience Helpers

```typescript
// Full result with token counts, cost, latency
generateWithAgent(agent, type, prompt, context, options): Promise<GatewayResult>

// Text-only extraction
generateText(agent, type, prompt, context, options): Promise<string>
```

## Generation Types

`caption | reply | description | cta | campaign | storefront_suggestion | pricing_suggestion | reengagement_prompt | onboarding_insight | conversion_analysis | custom`

## Audit Log

Every generation is logged to `ai_generations`:
- `creator_id`, `generation_type`, `model`
- `prompt_input` (truncated to 2000 chars)
- `output` (truncated to 5000 chars)
- `tokens_used`, `was_used`

Cost events are logged to `ai_cost_events` with full token breakdown per agent call.
