// Task #54 — Production fresh-start wipe.
//
// Removes every advisor, secondary profile, lead, page-view stat, client,
// consent row, PII audit row and client document from the database. Leaves
// the session table alone so live admin sessions survive. Admin login is
// password-based (ADMIN_PASSWORD), not tied to an advisor row, so it keeps
// working after the wipe.
//
// SAFETY:
//   - Dry-run by default. Pass --apply to execute.
//   - Writes JSON + CSV backups of every affected table to
//     .local/backups/fresh-start-<ISO>/ BEFORE touching anything. That
//     directory is git-ignored — backups contain raw PII (names, phones,
//     emails) and credential hashes (advisor_password_hash) and MUST NEVER
//     be committed to the repo. Override the location with --backup-dir.
//   - Idempotent: refuses to overwrite an existing backup directory.
//   - Entire wipe runs inside a single transaction. If any step throws,
//     the transaction rolls back and the database is unchanged.
//   - audit_pii has Postgres rules that rewrite UPDATE/DELETE to NOTHING.
//     The script DROPS those rules inside the transaction, deletes, and
//     re-creates them before COMMIT. Rollback restores them with the data.
//   - After a successful commit, deletes the contents of uploads/clients/
//     and uploads/scans/ on the local filesystem (encrypted blobs that
//     were pointed to by the now-deleted DB rows). Errors during disk
//     cleanup are logged but do not roll back the DB wipe.
//
// USAGE:
//   npx tsx scripts/freshStart.ts                        # dry-run
//   npx tsx scripts/freshStart.ts --apply                # actual wipe
//   npx tsx scripts/freshStart.ts --apply --backup-dir=/some/path

import { pool } from "../server/db";
import fs from "fs";
import path from "path";

const APPLY = process.argv.includes("--apply");
const customDir = process.argv.find((a) => a.startsWith("--backup-dir="))?.split("=")[1];

const TABLES = [
  "advisors",
  "advisor_profiles",
  "emails",
  "stats",
  "clients",
  "client_consent",
  "client_documents",
  "audit_pii",
] as const;

const UPLOAD_DIRS = ["uploads/clients", "uploads/scans"];

function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function clearDirContents(dir: string): { removed: number; errors: string[] } {
  const result = { removed: 0, errors: [] as string[] };
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    try {
      fs.rmSync(full, { recursive: true, force: true });
      result.removed++;
    } catch (e) {
      result.errors.push(`${full}: ${(e as Error).message}`);
    }
  }
  return result;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = customDir ?? path.resolve(".local", "backups", `fresh-start-${stamp}`);

  console.log(`[fresh-start] Mode: ${APPLY ? "APPLY (will mutate)" : "DRY-RUN (read-only)"}`);
  console.log(`[fresh-start] Backup dir: ${dir}`);

  // Idempotency: refuse to overwrite an existing backup dir.
  if (fs.existsSync(dir)) {
    console.error(`[fresh-start] Refusing to overwrite existing backup dir: ${dir}`);
    process.exit(1);
  }
  fs.mkdirSync(dir, { recursive: true });

  const backupCounts: Record<string, number> = {};
  for (const t of TABLES) {
    const { rows } = await pool.query(`SELECT * FROM ${t}`);
    backupCounts[t] = rows.length;
    fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2));
    fs.writeFileSync(path.join(dir, `${t}.csv`), toCsv(rows));
    console.log(`[fresh-start] backup ${t}: ${rows.length} rows`);
  }

  if (!APPLY) {
    const manifest = [
      `Fresh-start backup (DRY-RUN)`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Row counts at backup time:`,
      ...TABLES.map((t) => `  ${t}: ${backupCounts[t]}`),
      ``,
      `No rows were deleted. Pass --apply to wipe.`,
    ].join("\n");
    fs.writeFileSync(path.join(dir, "manifest.txt"), manifest);
    console.log(`[fresh-start] DRY-RUN complete. No rows deleted.`);
    process.exit(0);
  }

  // ── APPLY path ───────────────────────────────────────────────────────
  console.log(`[fresh-start] Starting transaction…`);
  const client = await pool.connect();
  const deleted: { sql: string; rowCount: number }[] = [];
  try {
    await client.query("BEGIN");

    // audit_pii is append-only via Postgres rules — drop them for the
    // wipe, restore inside the same transaction so a rollback puts them
    // back along with the data.
    await client.query(`DROP RULE IF EXISTS audit_pii_no_update ON audit_pii;`);
    await client.query(`DROP RULE IF EXISTS audit_pii_no_delete ON audit_pii;`);

    // Walk dependents -> parents. No FKs in production, but the order
    // still matches logical ownership so any partial-failure log is
    // readable.
    const order = [
      `DELETE FROM client_documents`,
      `DELETE FROM client_consent`,
      `DELETE FROM audit_pii`,
      `DELETE FROM clients`,
      `DELETE FROM emails`,
      // Stats: only the event rows tied to advisors. Nothing else writes
      // to this table today, but the WHERE keeps the script safe if that
      // ever changes.
      `DELETE FROM stats WHERE event_type IN ('email_received', 'referral_sent') OR event_type LIKE 'app_access%'`,
      `DELETE FROM advisor_profiles`,
      `DELETE FROM advisors`,
    ];
    for (const sql of order) {
      const r = await client.query(sql);
      const rowCount = r.rowCount ?? 0;
      deleted.push({ sql, rowCount });
      console.log(`[fresh-start] ${sql} -> ${rowCount} rows`);
    }

    // Re-create the append-only rules so audit_pii is locked down post-wipe.
    await client.query(`CREATE RULE audit_pii_no_update AS ON UPDATE TO audit_pii DO INSTEAD NOTHING;`);
    await client.query(`CREATE RULE audit_pii_no_delete AS ON DELETE TO audit_pii DO INSTEAD NOTHING;`);

    await client.query("COMMIT");
    console.log(`[fresh-start] COMMIT ok.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[fresh-start] ROLLBACK — nothing changed. Error:`, err);
    process.exit(1);
  } finally {
    client.release();
  }

  // Post-commit verification
  console.log(`[fresh-start] Verifying post-wipe counts…`);
  const finalCounts: Record<string, number> = {};
  let bad = 0;
  for (const t of TABLES) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    const n = rows[0].n as number;
    finalCounts[t] = n;
    console.log(`[fresh-start] ${t}: ${n} ${n === 0 ? "OK" : "STILL HAS ROWS"}`);
    if (n !== 0) bad++;
  }

  // Disk cleanup. Best-effort: log but do not throw — DB is already wiped.
  console.log(`[fresh-start] Cleaning upload directories…`);
  const diskResults: Record<string, { removed: number; errors: string[] }> = {};
  for (const d of UPLOAD_DIRS) {
    const r = clearDirContents(path.resolve(d));
    diskResults[d] = r;
    console.log(`[fresh-start] ${d}: removed ${r.removed} entries${r.errors.length ? `, ${r.errors.length} errors` : ""}`);
    for (const e of r.errors) console.warn(`  ! ${e}`);
  }

  // Manifest now reflects the actual run.
  const manifest = [
    `Fresh-start wipe (APPLY)`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Row counts at backup time:`,
    ...TABLES.map((t) => `  ${t}: ${backupCounts[t]}`),
    ``,
    `Delete results:`,
    ...deleted.map((d) => `  ${d.sql}  ->  ${d.rowCount} rows`),
    ``,
    `Post-wipe verification:`,
    ...TABLES.map((t) => `  ${t}: ${finalCounts[t]} ${finalCounts[t] === 0 ? "OK" : "FAIL"}`),
    ``,
    `Disk cleanup:`,
    ...UPLOAD_DIRS.map((d) => `  ${d}: removed ${diskResults[d].removed}, errors ${diskResults[d].errors.length}`),
  ].join("\n");
  fs.writeFileSync(path.join(dir, "manifest.txt"), manifest);
  console.log(`[fresh-start] Wrote ${path.join(dir, "manifest.txt")}`);

  if (bad > 0) {
    console.error(`[fresh-start] ${bad} table(s) still hold rows. Investigate.`);
    process.exit(1);
  }
  console.log(`[fresh-start] Done.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[fresh-start] Fatal:`, err);
  process.exit(1);
});
