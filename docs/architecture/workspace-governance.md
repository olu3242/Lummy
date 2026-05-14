# Workspace Governance

Validation commands:
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run check:deps`
- `pnpm run validate:migrations`
- `pnpm run ci:validate`

CI fails on broken TS references, circular dependencies, import boundary violations, or missing migration files.
