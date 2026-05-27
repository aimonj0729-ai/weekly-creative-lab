#!/usr/bin/env python3
"""Score Side-Alley Radar opportunity candidates.

The score intentionally rewards narrow, shippable, low-risk ideas over generic
"build a huge platform" ideas.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


WEIGHTS = {
    "pain": 1.6,
    "entry_ease": 1.2,
    "competition_inverse": 1.5,
    "taste_leverage": 1.1,
    "weekly_shippability": 1.4,
    "trust_safety": 1.0,
}


def score(item: dict[str, Any]) -> float:
    total_weight = sum(WEIGHTS.values())
    weighted = sum(float(item.get(key, 0)) * weight for key, weight in WEIGHTS.items())
    return round((weighted / total_weight) * 10, 1)


def load_payload(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload.get("opportunities"), list):
        raise ValueError("Expected an 'opportunities' array in the input JSON.")
    return payload


def main(argv: list[str]) -> int:
    input_path = Path(argv[1]) if len(argv) > 1 else Path("opportunities.json")
    payload = load_payload(input_path)
    ranked = sorted(payload["opportunities"], key=score, reverse=True)

    print(f"Side-Alley Radar snapshot: {payload.get('snapshot_date', 'unknown')}")
    print(f"Theme: {payload.get('theme', 'unknown')}")
    print()

    for index, item in enumerate(ranked, start=1):
        print(f"{index}. {item['name']} — {score(item)}")
        print(f"   Audience: {item['audience']}")
        print(f"   Wedge: {item['wedge']}")
        print(f"   First artifact: {item['first_artifact']}")
        print()

    winner = ranked[0]
    print(f"Recommended weekly build: {winner['name']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
