# Dependency Rules

1. `packages/repositories` must not import from `src/**` UI modules.
2. `packages/telemetry` must remain side-effect-free and domain-agnostic.
3. `packages/runtime-orchestrator` and `packages/runtime-governance` depend on shared contracts only.
4. Event producers should publish through `@lummy/event-registry` envelopes.
5. Avoid deep imports across packages.
