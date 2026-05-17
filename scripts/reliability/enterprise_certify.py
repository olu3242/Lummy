#!/usr/bin/env python3
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

@dataclass
class Probe:
    category: str
    control: str
    file: str
    required: list[str]
    weight: int

PROBES = [
    Probe("runtime_resilience", "queue_retry_dlq", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["RETRY_QUEUE", "DLQ_QUEUE", "job.retried", "job.dead_lettered"], 12),
    Probe("runtime_resilience", "replay_guard", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["ReplayIntegrityValidator", "replay validation failed"], 8),
    Probe("observability", "correlation_events", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["correlationId", "latencyMs", "job.started", "job.completed"], 10),
    Probe("payment_safety", "reconciliation_idempotency", "packages/payments/src/reconciliation/service.ts", ["settlement_key", "replayed: true", "wallet.credit"], 15),
    Probe("ai_governance", "provider_failover", "packages/ai-engine/src/providers/router.ts", ["provider execution failed", "fallback", "CHAOS_PROVIDER_OUTAGE"], 10),
    Probe("governance", "reliability_gate", ".github/workflows/reliability-gate.yml", ["python3 scripts/reliability/certify.py", "pull_request"], 10),
    Probe("operational_readiness", "certification_docs", "docs/operations/reliability-certification.md", ["Gate threshold", "CI/CD enforcement"], 8),
    Probe("security", "runtime_locking", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["lock.acquire", "lock.release"], 10),
    Probe("scalability", "queue_topology", "packages/runtime-orchestrator/src/contracts/types.ts", ["MANDATORY_QUEUES", "events.outbox", "payments.reconcile"], 8),
    Probe("financial_safety", "provider_outage_controls", "packages/payments/src/reconciliation/service.ts", ["CHAOS_PAYMENT_PROVIDER_OUTAGE", "CHAOS_RECONCILIATION_MISMATCH"], 9),
]

CATEGORY_THRESHOLDS = {
    "runtime_resilience": 75,
    "observability": 70,
    "payment_safety": 80,
    "ai_governance": 70,
    "governance": 70,
    "security": 70,
    "operational_readiness": 70,
    "scalability": 60,
    "financial_safety": 75,
}

RISK_BANDS = [(85, "LOW"), (70, "MEDIUM"), (50, "HIGH"), (0, "CRITICAL")]

def band(score: float) -> str:
    for threshold, label in RISK_BANDS:
        if score >= threshold:
            return label
    return "CRITICAL"

def run() -> int:
    findings = []
    by_cat = {}
    for p in PROBES:
        text = (ROOT / p.file).read_text(encoding="utf-8") if (ROOT / p.file).exists() else ""
        missing = [t for t in p.required if t not in text]
        passed = not missing
        findings.append({"category": p.category, "control": p.control, "file": p.file, "passed": passed, "missing": missing, "weight": p.weight})
        cat = by_cat.setdefault(p.category, {"earned": 0, "total": 0, "controls": []})
        cat["total"] += p.weight
        if passed:
            cat["earned"] += p.weight
        cat["controls"].append(findings[-1])

    scorecard = {}
    total_earned = 0
    total_possible = 0
    risks = {}
    for cat, data in by_cat.items():
        score = round((data["earned"] / data["total"] * 100), 2) if data["total"] else 0.0
        scorecard[cat] = {
            "score": score,
            "threshold": CATEGORY_THRESHOLDS.get(cat, 70),
            "pass": score >= CATEGORY_THRESHOLDS.get(cat, 70),
            "risk": band(score),
        }
        risks[cat] = band(score)
        total_earned += data["earned"]
        total_possible += data["total"]

    overall = round((total_earned / total_possible * 100), 2) if total_possible else 0.0
    readiness = "ENTERPRISE READY" if overall >= 90 else "PRODUCTION READY" if overall >= 80 else "PARTIALLY READY" if overall >= 65 else "NOT READY"

    report = {
        "overall_score": overall,
        "readiness": readiness,
        "scorecard": scorecard,
        "risks": risks,
        "findings": findings,
        "gaps": [f for f in findings if not f["passed"]],
    }
    out_dir = ROOT / "artifacts"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "enterprise-certification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if overall >= 80 else 1

if __name__ == "__main__":
    raise SystemExit(run())
