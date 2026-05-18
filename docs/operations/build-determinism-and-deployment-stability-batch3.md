# Build Determinism + Deployment Stability — Batch 3

## 1) Build-system audit

### Observed topology
- Root build orchestrates via `turbo run build`.
- Package/app compile units are TypeScript composite projects with project references.
- CI pipelines currently execute install/lint/typecheck/build, with no explicit graph gate in baseline.

### Determinism risks identified
1. TypeScript deprecation policy instability (TS5101) could fail builds inconsistently across toolchain upgrades.
2. Build graph regressions were not explicitly blocked by CI contract checks (`madge` and project-reference build) before this batch.
3. Release preflight did not have a single deterministic governance entry point.

## 2) Deployment-stability audit

### Current posture
- Deploy safety is mostly procedural through docs/workflows.
- Runtime deployment compatibility depends on successful deterministic build/reference checks.

### Risks
- Hidden reference regressions can pass partial checks and fail at promotion stages.
- Graph cycles can reappear without CI contract gate coverage.

## 3) CI/CD governance analysis

### Pre-batch
- `ci.yml` executed lint, typecheck, build only.

### Batch hardening
- Added explicit dependency-graph and project-reference gates to CI validate job:
  - `pnpm check:graph`
  - `pnpm build:references`

This shifts CI from generic success checks to explicit build-governance enforcement.

## 4) Build determinism report

### Modifications
1. Added `ignoreDeprecations: "6.0"` to root TS base config to stabilize compiler behavior under TS deprecation policy transitions.
2. Added deterministic build governance scripts:
   - `build:determinism`
   - `build:references`
   - `release:preflight`
3. Wired graph + reference validation into CI.

### Determinism impact
- Compiler deprecation policy no longer causes non-functional build failures in TS6 policy mode.
- Project-reference validity is now enforced before build completion in CI.

## 5) Runtime compatibility analysis

- Runtime package compatibility is governed by:
  - project references (`tsc -b` topology)
  - graph cycle checks (`madge`)
  - lint/typecheck/build gates
- Replay/runtime contract changes from previous batches remain safe so long as `build:references` passes.

## 6) Exact build modifications

1. `tsconfig.base.json`
   - Added `"ignoreDeprecations": "6.0"`.
2. `package.json`
   - Added `build:determinism`.
   - Added `build:references`.
   - Added `release:preflight`.
3. `.github/workflows/ci.yml`
   - Added `pnpm check:graph`.
   - Added `pnpm build:references`.

## 7) Exact deployment modifications

- No speculative deployment platform changes introduced.
- Deployment safety improved through stronger pre-deploy CI governance gates.

## 8) Release-governance plan

### Required promotion gates
1. `pnpm check:graph`
2. `pnpm build:references`
3. `pnpm turbo run typecheck lint`
4. `pnpm build`

### Governance command
- `pnpm release:preflight` becomes canonical pre-release verification entry point.

### Rollback
- If a release candidate fails deterministic checks after merge, block promotion and revert only the offending package/reference edge.
