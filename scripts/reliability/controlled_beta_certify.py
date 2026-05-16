#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

REQUIRED_PATHS = [
    "src/app/api/runtime/queues/route.ts",
    "src/app/api/runtime/replays/route.ts",
    "apps/workers/src/runtime/worker.ts",
    "packages/runtime-orchestrator/src/replay/service.ts",
    "packages/payments/src/webhooks/service.ts",
    "packages/payments/src/reconciliation/service.ts",
    "packages/ai-engine/src/providers/router.ts",
    "packages/telemetry/src/service.ts",
]

REQUIRED_ENVS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "SENTRY_DSN",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "STRIPE_SECRET_KEY",
    "PAYSTACK_SECRET_KEY",
]


def main() -> int:
    root = Path(__file__).resolve().parents[2]

    path_checks = {p: (root / p).exists() for p in REQUIRED_PATHS}
    env_template_exists = (root / ".env.example").exists()

    score = 0
    score += sum(1 for ok in path_checks.values() if ok) * 8
    score += 10 if env_template_exists else 0
    score = min(score, 100)

    report = {
        "batch": "production-operations-controlled-beta-certification",
        "score": score,
        "path_checks": path_checks,
        "env_template_exists": env_template_exists,
        "status": "pass" if score >= 85 else "needs-hardening",
    }

    print(json.dumps(report, indent=2))
    return 0 if score >= 85 else 1


if __name__ == "__main__":
    raise SystemExit(main())
