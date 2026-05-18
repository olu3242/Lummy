# Global Launch Readiness Audit

Executable launch audit for production deployment and enterprise go-live governance.

## What it validates
- deployment reproducibility and release build invariants
- reliability and enterprise certification gates
- runtime retry/DLQ + locking controls
- AI failover controls and payment idempotency controls
- observability event/correlation fields
- operational launch governance documentation coverage

## Runbook
- Local: `python3 scripts/reliability/launch_readiness.py`
- CI: `.github/workflows/launch-readiness.yml`
- Output artifact: `artifacts/launch-readiness.json`

## Decision bands
- `>=92`: ENTERPRISE LAUNCH READY
- `82-91.99`: PRODUCTION READY
- `68-81.99`: LIMITED BETA READY
- `55-67.99`: INTERNAL READY
- `<55`: NOT READY

## Enforcement
Pipeline fails when overall score is below `82`.
