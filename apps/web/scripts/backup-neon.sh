#!/usr/bin/env bash
#
# One-shot Neon backup — pg_dump the whole production DB to a
# timestamped gzipped file. Run from the repo root or apps/web/.
#
# Usage:
#   pnpm run backup:neon        (see package.json script)
#   ./scripts/backup-neon.sh    (direct)
#
# Reads DATABASE_URL from .env.production.local by default; override by
# exporting DATABASE_URL yourself before running. Output lands in
# ./backups/bizbridge-<YYYYMMDD-HHMMSS>.sql.gz — that dir is gitignored.
#
# Requires: pg_dump (Postgres client tools, matched to server major).
# Neon runs Postgres 17 as of 2026-08 — use pg_dump 17+ or you'll see
# a version mismatch warning.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"
ENV_FILE="$WEB_DIR/.env.production.local"

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$ENV_FILE" ]]; then
  # Source only DATABASE_URL from the env file so we don't leak
  # other secrets into the shell.
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'\')"
  export DATABASE_URL
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Add it to $ENV_FILE or export before running." >&2
  exit 1
fi

BACKUP_DIR="$REPO_ROOT/backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/bizbridge-$STAMP.sql.gz"

echo "==> Dumping to $OUT"
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found in PATH. Install Postgres client tools." >&2
  exit 1
fi

# --no-owner + --no-privileges = restore-friendly across environments.
# --clean --if-exists = restore drops existing objects safely.
pg_dump \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean --if-exists \
  "$DATABASE_URL" | gzip -9 > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "==> Done. $OUT ($SIZE)"

# Keep the 7 most recent backups; delete older ones so the folder
# doesn't grow forever.
ls -t "$BACKUP_DIR"/bizbridge-*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm --
echo "==> Pruned to 7 most recent backups."
