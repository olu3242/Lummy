# Dependency Graph Audit

## Commands Run

- `pnpm exec madge --circular --extensions ts packages apps src`
- `pnpm exec madge --circular --extensions ts --exclude '(^|/)dist/' packages apps src`
- Workspace package/reference/alias scripts using local package metadata.

## Results

- Full madge scan initially reported six cycles, all through generated `dist/*.d.ts` files.
- Source-only madge scan reported no circular dependencies before and after repairs.
- One direct cross-package source import was found and repaired:
  - `packages/automation-engine/src/engine/runner.ts`
- Missing tsconfig package references were added:
  - `packages/operational-readiness`
  - `packages/platform-health`
  - `packages/runtime-hardening`
- Missing workspace dependency declarations were added to affected package and app manifests.

## Risk

The current source graph is healthy. Generated output can still pollute ad hoc graph checks if `dist` is included, so the workspace scripts now exclude it.

## Recommended Gate

Keep `check:deps` source-only by excluding `dist`, and run it before release branches. Pair it with `pnpm run typecheck` so TypeScript catches contract drift.
