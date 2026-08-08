"""Apply a batch of English translations to sector-explanations.json.

Reads scripts/translations-inbox.json which is a map { "<mor_code>": ["en_op1", "en_op2", ...] }
and writes the values into the operations_en array on the matching entry.

Length must match operations_am length. If it doesn't, the row is skipped and
reported. After applying, translations-inbox.json is emptied so successive
batches can be appended.
"""

import json
import io
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = Path(__file__).parent.parent
DATA = ROOT / "apps" / "web" / "src" / "seed" / "data" / "sector-explanations.json"
INBOX = ROOT / "scripts" / "translations-inbox.json"


def main():
    if not INBOX.exists():
        print(f"No inbox at {INBOX}. Create it with {{\"<code>\": [\"...\"]}} map.")
        return
    inbox = json.loads(INBOX.read_text(encoding="utf-8"))
    data = json.loads(DATA.read_text(encoding="utf-8"))

    applied = 0
    skipped = []
    missing = []

    for code, ens in inbox.items():
        entry = data["byCode"].get(code)
        if not entry:
            missing.append(code)
            continue
        if len(ens) != len(entry["operations_am"]):
            skipped.append(
                f"{code}: expected {len(entry['operations_am'])} ops, got {len(ens)}"
            )
            continue
        entry["operations_en"] = ens
        # Mirror to entries list
        for e in data["entries"]:
            if e["mor_code"] == code:
                e["operations_en"] = ens
                break
        applied += 1

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    INBOX.write_text("{}", encoding="utf-8")

    # Progress report
    total = len(data["entries"])
    with_en = sum(
        1
        for e in data["entries"]
        if e.get("operations_en") and all(o for o in e["operations_en"])
    )
    print(f"Applied {applied} translations. Missing codes: {missing}. Skipped: {skipped}")
    print(f"Progress: {with_en}/{total} sectors have complete English translations.")


if __name__ == "__main__":
    main()
