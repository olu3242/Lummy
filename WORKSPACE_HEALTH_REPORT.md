# Workspace Health Report

Branch: `stabilization/post-integration-hardening`
Baseline: `bf518a8`

## Summary

The workspace is deployable after the integration merge. Governance checks found several post-merge hygiene gaps, and the low-risk graph/manifest repairs have been applied in this hardening pass.

## Findings

- `pnpm exec madge --circular --extensions ts --exclude '(^|/)dist/' packages apps src` found no source-level circular dependencies.
- The existing `check:deps` script scanned generated `dist` declarations and reported false circulars. It now excludes `dist`.
- `tsconfig.packages.json` was missing references for `packages/operational-readiness`, `packages/platform-health`, and `packages/runtime-hardening`; all package refs are now present.
- `tsconfig.base.json` contained only 51 `@lummy/*` aliases for 95 workspace packages. All package aliases are now present.
- One direct cross-package source import existed in `packages/automation-engine/src/engine/runner.ts`; it now imports `@lummy/runtime-orchestrator`.
- Multiple workspace imports were not declared in local `package.json` dependency maps. Missing declarations are now added as `workspace:*`.
- Workspace package names are unique. No stale package references were found in `tsconfig.packages.json`.
- Supabase migrations are sequential from `001` through `036`; no numbering gaps were detected.

## Repairs Applied

- Add the three missing package references to `tsconfig.packages.json`.
- Add missing `@lummy/*` path aliases for workspace packages.
- Replace the direct runtime source import with `@lummy/runtime-orchestrator`.
- Add missing workspace dependency declarations using `workspace:*`.
- Exclude `dist` from dependency graph checks.

## Post-Repair Verification

- Undeclared workspace dependency audit: clean.
- `tsconfig.packages.json` package reference audit: clean.
- `tsconfig.base.json` package alias audit: clean.
- Source circular dependency scan: clean.
- Merge marker and unmerged file checks: clean.

## Residual Watch Items

- The root app has both `next.config.mjs` and `next.config.ts`; deployment should standardize on one config file in a future cleanup window.
- Several package manifests still expose `./src/index.ts` directly. That is current repo convention, but a future publishable package strategy should move to built `dist` exports.
