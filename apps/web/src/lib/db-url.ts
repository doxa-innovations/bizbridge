/**
 * Normalize DATABASE_URL for the pg driver.
 *
 * `pg-connection-string` v2 currently treats `sslmode=require` as an alias
 * for `verify-full` but prints a deprecation warning on every connection and
 * plans to change that in v3 to weaker (libpq-compatible) semantics. We
 * always want the stricter behaviour, so we rewrite the connection string
 * once and pass the explicit `verify-full` value to every pg Pool.
 *
 * Keep this in one place so a future flag flip (or a switch to
 * `uselibpqcompat=true`) is a one-line change.
 */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  if (!raw) {
    throw new Error('DATABASE_URL is required')
  }
  return raw.replace(/([?&])sslmode=require\b/g, '$1sslmode=verify-full')
}
