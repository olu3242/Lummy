#!/usr/bin/env python3
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

@dataclass
class Check:
    id: str
    file: str
    must_contain: list[str]
    weight: int

CHECKS = [
    Check("queue_recovery", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["job.retried", "job.dead_lettered", "RETRY_QUEUE"], 20),
    Check("replay_determinism", "packages/runtime-orchestrator/src/chaos/simulators.ts", ["ReplayIntegrityValidator", "CHAOS_REPLAY_CORRUPTION_DETECTED"], 15),
    Check("worker_recovery", "packages/runtime-orchestrator/src/chaos/simulators.ts", ["CHAOS_WORKER_TERMINATED", "CHAOS_LOCK_EXPIRED"], 15),
    Check("ai_failover", "packages/ai-engine/src/providers/router.ts", ["provider execution failed", "CHAOS_PROVIDER_OUTAGE"], 15),
    Check("payment_replay_safety", "packages/payments/src/reconciliation/service.ts", ["replayed: true", "settlement_key"], 20),
    Check("telemetry_propagation", "packages/runtime-orchestrator/src/execution/coordinator.ts", ["job.started", "correlationId", "latencyMs"], 15),
]

def run() -> int:
    results = []
    earned = 0
    total = sum(c.weight for c in CHECKS)

    for check in CHECKS:
        file_path = ROOT / check.file
        text = file_path.read_text(encoding="utf-8") if file_path.exists() else ""
        missing = [token for token in check.must_contain if token not in text]
        passed = len(missing) == 0
        if passed:
            earned += check.weight
        results.append({"id": check.id, "file": check.file, "passed": passed, "missing": missing, "weight": check.weight})

    score = round((earned / total) * 100, 2) if total else 0.0
    report = {
        "score": score,
        "earned": earned,
        "total": total,
        "passed": score >= 85,
        "checks": results,
    }

    out_dir = ROOT / "artifacts"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "reliability-score.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["passed"] else 1

if __name__ == "__main__":
    raise SystemExit(run())
