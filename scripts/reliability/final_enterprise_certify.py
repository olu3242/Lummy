#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

GATES = [
    ("controlled_beta", ["python3", "scripts/reliability/controlled_beta_certify.py"]),
    ("base_reliability", ["python3", "scripts/reliability/certify.py"]),
    ("enterprise_reliability", ["python3", "scripts/reliability/enterprise_certify.py"]),
    ("launch_readiness", ["python3", "scripts/reliability/launch_readiness.py"]),
]


def run_gate(root: Path, cmd: list[str]) -> tuple[int, str]:
    proc = subprocess.run(cmd, cwd=root, text=True, capture_output=True)
    out = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
    return proc.returncode, out.strip()


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    results: dict[str, dict[str, object]] = {}

    passed = 0
    for name, cmd in GATES:
        code, output = run_gate(root, cmd)
        ok = code == 0
        if ok:
            passed += 1
        results[name] = {
            "ok": ok,
            "exit_code": code,
            "command": " ".join(cmd),
            "output_excerpt": "\n".join(output.splitlines()[-15:]),
        }

    score = round((passed / len(GATES)) * 100)
    status = "enterprise-ready" if score == 100 else "internal-ready-only"

    report = {
        "program": "final-enterprise-readiness-certification",
        "score": score,
        "status": status,
        "gates": results,
    }

    print(json.dumps(report, indent=2))
    return 0 if score == 100 else 1


if __name__ == "__main__":
    raise SystemExit(main())
