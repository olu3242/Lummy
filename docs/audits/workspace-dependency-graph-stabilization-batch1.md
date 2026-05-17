# Workspace Dependency Graph Stabilization — Batch 1

## Workspace dependency audit

### Observed graph issues
- TypeScript project references contained circular edges involving:
  - `runtime-orchestrator -> shared-types -> platform-core -> shared-types`
  - `ai-engine -> db-core -> platform-core -> shared-types -> platform-core`
- Root cause: unnecessary tsconfig references to `platform-core` from leaf/shared packages that did not import platform-core symbols.

## Project-reference cycle map

### Cycle A
1. `packages/runtime-orchestrator/tsconfig.json` references `packages/shared-types`
2. `packages/shared-types/tsconfig.json` referenced `packages/platform-core`
3. `packages/platform-core/tsconfig.json` references `packages/shared-types`

### Cycle B
1. `packages/ai-engine/tsconfig.json` references `packages/db-core`
2. `packages/db-core/tsconfig.json` referenced `packages/platform-core`
3. `packages/platform-core/tsconfig.json` references `packages/shared-types`
4. `packages/shared-types/tsconfig.json` referenced `packages/platform-core`

## Runtime coupling analysis

- `runtime-orchestrator` correctly depends on `shared-types` for tenant queue envelope typing.
- `db-core` uses `shared-types` contracts and did not require `platform-core` coupling.
- `shared-types` should remain dependency-minimal; coupling to `platform-core` is architectural inversion.

## Shared-type governance report

- `shared-types` acts as a contract root and must not depend on higher-level runtime/core packages.
- Governance rule enforced in this batch:
  - Contract package may be referenced by feature/runtime packages.
  - Contract package must not reference those packages back.

## Import-governance enforcement plan

1. Add lint rule follow-up to forbid imports from `@lummy/platform-core` inside `@lummy/shared-types` and `@lummy/db-core`.
2. Add CI check script to detect tsconfig reference back-edges from contract packages.
3. Keep package-export-only import policy (`@lummy/*`) and forbid deep `/src` imports.

## Exact dependency modifications

1. Updated `packages/shared-types/tsconfig.json`:
   - removed `../platform-core` project reference.
2. Updated `packages/db-core/tsconfig.json`:
   - removed `../platform-core` project reference.

## Build graph stabilization plan

1. Keep `shared-types` as a foundational leaf with no references.
2. Restrict `db-core` references to contract-only dependencies unless code imports prove otherwise.
3. Add graph validation gate in CI:
   - detect strongly connected components in tsconfig refs.
4. Introduce incremental package batches for cycle cleanup instead of monolithic graph rewrites.

## Rollback considerations

- Rollback is straightforward by reverting the two tsconfig changes.
- Rollback risk: reintroduces known cycle failures in `tsc -b` workspace builds.
