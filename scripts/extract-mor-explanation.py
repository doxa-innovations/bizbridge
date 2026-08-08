"""Re-extract MOR Directive 17/2011 Explanation Manual (Amharic PDF) using
pdfplumber's column-aware table detection. Outputs sector-explanations.json in
the shape expected by apps/web/src/seed/all-bilingual.ts:

    { "count": 519, "entries": [...], "byCode": { "39141": {...}, ... } }

Each entry: { serial, mor_code, name_am, legacy_codes[], operations_am[] }.

Handles:
- Header rows on every page (rows 0-1) skipped
- Rows that continue from the previous page (serial cell blank)
- Legacy codes: split on Amharic comma ፣ or ASCII comma, strip whitespace
- Operations text: pdfplumber returns multi-line cells with \\n — we split into
  logical bullets on newlines that follow a full stop / Amharic full stop, else
  concatenate with a single space.
"""

import pdfplumber
import io
import json
import re
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

ROOT = Path(__file__).parent.parent
PDF = ROOT / "docs" / "mor" / "MOR-Directive-17-2011-Explanation-Amharic.pdf"
OUT = ROOT / "apps" / "web" / "src" / "seed" / "data" / "sector-explanations.json"
REPORT = ROOT / "apps" / "web" / "src" / "seed" / "data" / "sector-explanations.report.txt"

HEADER_MARKERS = {"ተራ ቁ.", "አዲስ ኮድ", "ስያሜ", "ነባር ኮድ", "ማብራሪያ", "የፈቃድ መስጫ መደቡ"}


def clean_ws(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


def split_legacy_codes(cell: str | None) -> list[str]:
    if not cell:
        return []
    # Codes are 4-6 digit numbers, separated by ፣ or , with optional whitespace/newlines.
    return [c.strip() for c in re.findall(r"\d{4,6}", cell) if c.strip()]


def split_operations(cell: str | None) -> list[str]:
    """Split operations text into logical bullets.

    The source PDF uses either bullet dots (•) or just prose paragraphs. Preserve
    bullets when present; otherwise treat sentence-ending Amharic full stop (፡፡)
    as a bullet boundary. Fall back to a single item.
    """
    if not cell:
        return []
    text = cell.replace("\xa0", " ")

    # Bullet-list form: split on •
    if "•" in text:
        parts = [clean_ws(p) for p in text.split("•")]
        return [p for p in parts if p]

    # Prose form: join wrapped lines, then split on ፡፡ (Ethiopic full stop)
    joined = re.sub(r"\s*\n\s*", " ", text)
    joined = re.sub(r"\s+", " ", joined).strip()
    if not joined:
        return []

    # Split on Ethiopic full stop; keep the terminator on the preceding chunk.
    sentences = re.split(r"(?<=፡፡)\s+", joined)
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences or [joined]


def is_header_row(row: list[str | None]) -> bool:
    joined = " ".join((c or "") for c in row)
    return any(marker in joined for marker in ("ተራ ቁ.", "አዲስ ኮድ", "ስያሜ", "ነባር ኮድ", "ማብራሪያ"))


def extract() -> tuple[list[dict], list[str]]:
    """Return (entries, warnings)."""
    entries: list[dict] = []
    warnings: list[str] = []
    current: dict | None = None

    with pdfplumber.open(PDF) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            tables = page.find_tables()
            if not tables:
                warnings.append(f"page {page_num}: no tables detected")
                continue
            for t in tables:
                rows = t.extract()
                for row in rows:
                    if not row or len(row) < 5:
                        continue
                    if is_header_row(row):
                        continue

                    serial_raw, code_raw, name_raw, legacy_raw, ops_raw = row[:5]
                    serial = clean_ws(serial_raw)
                    code = clean_ws(code_raw)
                    name = clean_ws(name_raw)

                    # A fresh row starts a new sector when the serial + code cells
                    # are both populated with digits. Otherwise it's a continuation
                    # of the previous sector (row wrapped across page break).
                    if serial and code and serial.isdigit() and re.fullmatch(r"\d{4,6}", code):
                        if current:
                            entries.append(current)
                        current = {
                            "serial": int(serial),
                            "mor_code": code,
                            "name_am": name,
                            "legacy_codes": split_legacy_codes(legacy_raw),
                            "operations_am": split_operations(ops_raw),
                        }
                    else:
                        # Continuation row — append name/ops/legacy to current.
                        if not current:
                            warnings.append(
                                f"page {page_num}: orphan continuation row: {[clean_ws(c) for c in row[:5]]}"
                            )
                            continue
                        if name:
                            current["name_am"] = (current["name_am"] + " " + name).strip()
                        if legacy_raw:
                            current["legacy_codes"].extend(split_legacy_codes(legacy_raw))
                        if ops_raw:
                            extra = split_operations(ops_raw)
                            if extra:
                                # Merge into the last existing bullet if it looks
                                # like a continuation (no terminator), else append.
                                if current["operations_am"] and not current["operations_am"][-1].endswith("፡፡"):
                                    current["operations_am"][-1] = clean_ws(
                                        current["operations_am"][-1] + " " + extra[0]
                                    )
                                    current["operations_am"].extend(extra[1:])
                                else:
                                    current["operations_am"].extend(extra)

    if current:
        entries.append(current)

    # De-duplicate legacy codes while preserving order.
    for e in entries:
        seen: set[str] = set()
        uniq: list[str] = []
        for c in e["legacy_codes"]:
            if c not in seen:
                seen.add(c)
                uniq.append(c)
        e["legacy_codes"] = uniq

    return entries, warnings


def main():
    print(f"Extracting {PDF.name}…")
    entries, warnings = extract()

    by_code: dict[str, dict] = {}
    duplicates: list[str] = []
    for e in entries:
        code = e["mor_code"]
        if code in by_code:
            duplicates.append(code)
        by_code[code] = e

    payload = {
        "count": len(entries),
        "entries": entries,
        "byCode": by_code,
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # Report file
    empty_ops = [e for e in entries if not e["operations_am"]]
    empty_names = [e for e in entries if not e["name_am"]]
    report_lines = [
        f"Source: {PDF.name}",
        f"Total entries: {len(entries)}",
        f"Unique mor_codes: {len(by_code)}",
        f"Duplicate mor_codes: {len(duplicates)} → {duplicates[:20]}",
        f"Entries with empty operations_am: {len(empty_ops)}",
        f"Entries with empty name_am: {len(empty_names)}",
        f"Warnings: {len(warnings)}",
        "",
        "--- Empty operations (first 30) ---",
    ]
    for e in empty_ops[:30]:
        report_lines.append(f"  {e['serial']}\t{e['mor_code']}\t{e['name_am']}")
    report_lines.append("")
    report_lines.append("--- Warnings (first 30) ---")
    for w in warnings[:30]:
        report_lines.append(f"  {w}")

    REPORT.write_text("\n".join(report_lines), encoding="utf-8")

    print(f"Wrote {OUT.relative_to(ROOT)} ({len(entries)} entries, {len(by_code)} unique codes)")
    print(f"Wrote {REPORT.relative_to(ROOT)}")
    print(f"Empty ops: {len(empty_ops)}, Duplicates: {len(duplicates)}, Warnings: {len(warnings)}")


if __name__ == "__main__":
    main()
