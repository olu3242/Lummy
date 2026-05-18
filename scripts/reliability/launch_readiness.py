#!/usr/bin/env python3
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

@dataclass
class LaunchCheck:
    area: str
    id: str
    file: str
    tokens: list[str]
    weight: int

CHECKS = [
    LaunchCheck("deployment", "ci_reproducible", ".github/workflows/ci.yml", ["pnpm install --frozen-lockfile", "pnpm lint", "pnpm typecheck", "pnpm build"], 10),
    LaunchCheck("deployment", "release_build", ".github/workflows/release.yml", ["pnpm install --frozen-lockfile", "pnpm -r build"], 7),
    LaunchCheck("governance", "reliability_gate", ".github/workflows/reliability-gate.yml", ["python3 scripts/reliability/certify.py"], 8),
    LaunchCheck("governance", "enterprise_gate", ".github/workflows/enterprise-certification.yml", ["python3 scripts/reliability/enterprise_certify.py"], 8),
    LaunchCheck("runtime", "retry_dlq", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["RETRY_QUEUE", "DLQ_QUEUE", "job.dead_lettered"], 10),
    LaunchCheck("runtime", "locking", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["lock.acquire", "lock.release"], 8),
    LaunchCheck("ai", "provider_failover", "packages/ai-engine/src/providers/router.ts", ["fallback", "CHAOS_PROVIDER_OUTAGE", "provider execution failed"], 8),
    LaunchCheck("payments", "reconciliation_idempotency", "packages/payments/src/reconciliation/service.ts", ["replayed: true", "settlement_key", "wallet.credit"], 10),
    LaunchCheck("observability", "runtime_events", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["job.started", "job.completed", "correlationId", "latencyMs"], 9),
    LaunchCheck("ops", "launch_docs", "docs/operations/enterprise-certification-audit.md", ["Decision policy", "Caveat"], 7),
    LaunchCheck("ops", "reliability_docs", "docs/operations/reliability-certification.md", ["Gate threshold", "CI/CD enforcement"], 5),
]

THRESHOLDS = {
    "deployment": 75,
    "runtime": 75,
    "governance": 75,
    "observability": 70,
    "ai": 70,
    "payments": 80,
    "ops": 70,
}

READINESS_BANDS = [(92, "ENTERPRISE LAUNCH READY"), (82, "PRODUCTION READY"), (68, "LIMITED BETA READY"), (55, "INTERNAL READY"), (0, "NOT READY")]

RISK_BANDS = [(85, "LOW"), (70, "MEDIUM"), (50, "HIGH"), (0, "CRITICAL")]

def risk(score: float) -> str:
    for t, label in RISK_BANDS:
        if score >= t:
            return label
    return "CRITICAL"

def readiness(score: float) -> str:
    for t, label in READINESS_BANDS:
        if score >= t:
            return label
    return "NOT READY"

def run() -> int:
    area = {}
    findings = []
    for c in CHECKS:
        text = (ROOT / c.file).read_text(encoding="utf-8") if (ROOT / c.file).exists() else ""
        missing = [t for t in c.tokens if t not in text]
        passed = not missing
        f = {"area": c.area, "id": c.id, "file": c.file, "passed": passed, "missing": missing, "weight": c.weight}
        findings.append(f)
        bucket = area.setdefault(c.area, {"earned": 0, "total": 0})
        bucket["total"] += c.weight
        if passed:
            bucket["earned"] += c.weight

    scorecard = {}
    total_earned = 0
    total = 0
    for name, s in area.items():
        sc = round((s["earned"] / s["total"] * 100), 2) if s["total"] else 0.0
        scorecard[name] = {"score": sc, "threshold": THRESHOLDS.get(name, 70), "pass": sc >= THRESHOLDS.get(name, 70), "risk": risk(sc)}
        total_earned += s["earned"]
        total += s["total"]

    overall = round((total_earned / total * 100), 2) if total else 0.0
    report = {
        "overall_score": overall,
        "go_live_decision": readiness(overall),
        "scorecard": scorecard,
        "risk_report": {k: v["risk"] for k, v in scorecard.items()},
        "failed_checks": [f for f in findings if not f["passed"]],
        "all_checks": findings,
    }
    out = ROOT / "artifacts"
    out.mkdir(exist_ok=True)
    (out / "launch-readiness.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if overall >= 82 else 1

if __name__ == "__main__":
    raise SystemExit(run())
