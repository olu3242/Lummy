# Reliability Certification

This certification pipeline continuously validates runtime survivability before deployment.

## Automated checks

- queue recovery and dead-letter fallback
- replay determinism guardrails
- worker crash/lock-expiry handling hooks
- AI provider failover safety
- payment replay/idempotency safety
- telemetry correlation and latency instrumentation

## Scoring

- Script: `python3 scripts/reliability/certify.py`
- Output: `artifacts/reliability-score.json`
- Gate threshold: **85%**

## CI/CD enforcement

Workflow `.github/workflows/reliability-gate.yml` blocks the pipeline when certification fails.
