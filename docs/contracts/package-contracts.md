# Package Contracts

- Public APIs must be exported only from package root (`src/index.ts`).
- Cross-package imports must use package names, not deep file paths.
- UI (`src/**`) cannot be imported by repository/domain packages.
- Runtime orchestrator and governance packages consume interface contracts only.
- Payment flows must depend on provider interfaces, not concrete SDKs at domain layer.
