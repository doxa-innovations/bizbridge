"""Backfill operations_en in sector-explanations-recovered.json by copying
the English translation from the matched sector in sector-explanations.json.
The recovered rows describe the same underlying sector under a drifted MOR
code, so the matched code's English is the correct source."""

import json
import io
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = Path(__file__).parent.parent
MAIN = ROOT / "apps" / "web" / "src" / "seed" / "data" / "sector-explanations.json"
REC = ROOT / "apps" / "web" / "src" / "seed" / "data" / "sector-explanations-recovered.json"


def main():
    main_data = json.loads(MAIN.read_text(encoding="utf-8"))
    rec_data = json.loads(REC.read_text(encoding="utf-8"))
    by_code = main_data["byCode"]

    updated = 0
    for r in rec_data["recovered"]:
        matched = r.get("matched_code")
        src = by_code.get(matched)
        if not src:
            print(f"WARN: {r['original_code']} matched_code {matched} not in main byCode")
            continue

        am_ops = r.get("operations_am", [])
        src_en = src.get("operations_en", [])

        if len(am_ops) == 0:
            r["operations_en"] = []
        elif len(src_en) == len(am_ops):
            r["operations_en"] = list(src_en)
        else:
            # Length mismatch — collapse or expand as a single joined string.
            joined = " ".join(o for o in src_en if o).strip()
            r["operations_en"] = [joined] * len(am_ops) if joined else []
            print(f"NOTE: {r['original_code']} length mismatch ({len(am_ops)} am vs {len(src_en)} en) — joined + duplicated")

        updated += 1

    REC.write_text(json.dumps(rec_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Backfilled operations_en on {updated}/{len(rec_data['recovered'])} recovered rows.")


if __name__ == "__main__":
    main()
