# Import Rules

- `routes/pages` cannot import `@lummy/db-core`.
- `packages/events` cannot import analytics or ai packages.
- `apps/workers` must use orchestrator/events abstractions, not direct DB/repository imports.
- Cross-package imports must use `@lummy/<package>` aliases.
- Package-private deep imports are disallowed.
