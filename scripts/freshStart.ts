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
//   - Writes CSV backups of every affected table to
//     backups/fresh-start-<ISO>/ BEFORE touching anything.
//   - Entire wipe runs inside a single transaction. If any step throws, the
//     transaction rolls back and the database is unchanged.
//   - audit_pii has Postgres rules that rewrite UPDATE/DELETE to NOTHING.
//     The script DROPS those rules inside the transaction, deletes, and
//     re-creates them before COMMIT. If anything fails, rollback restores
//     the rules along with the data.
//
// USAGE:
//   npx tsx scripts/freshStart.ts            # dry-run, prints counts only
//   npx tsx scripts/freshStart.ts --apply    # actually wipe
//
// AFTER A SUCCESSFUL --apply:
//   On the deployed VM, also remove the orphaned encrypted files:
//     rm -rf uploads/clients/* uploads/scans/*
//   (These are unreachable without the now-deleted DB rows that pointed to
//   them, and they're AES-GCM encrypted, but tidy them up anyway.)

import { pool } from "../server/db";
import fs from "fs";
import path from "path";

const APPLY = process.argv.includes("--apply");

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

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.resolve("backups", `fresh-start-${stamp}`);

  console.log(`[fresh-start] Mode: ${APPLY ? "APPLY (will mutate)" : "DRY-RUN (read-only)"}`);
  console.log(`[fresh-start] Backup dir: ${dir}`);

  fs.mkdirSync(dir, { recursive: true });

  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const { rows } = await pool.query(`SELECT * FROM ${t}`);
    counts[t] = rows.length;
    fs.writeFileSync(path.join(dir, `${t}.csv`), toCsv(rows));
    console.log(`[fresh-start] ${t}: ${rows.length} rows backed up`);
  }

  const manifest = [
    `Fresh-start backup`,
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`,
    ``,
    `Row counts at backup time:`,
    ...TABLES.map((t) => `  ${t}: ${counts[t]}`),
    ``,
    `Restoration hint: each CSV is a straight SELECT * dump of the table at`,
    `backup time. To re-insert, write a one-off script that reads the CSV and`,
    `INSERTs row-by-row in the dependency order: advisors -> advisor_profiles`,
    `-> emails / stats / clients -> client_consent / client_documents / audit_pii.`,
  ].join("\n");
  fs.writeFileSync(path.join(dir, "manifest.txt"), manifest);
  console.log(`[fresh-start] Wrote manifest.txt`);

  if (!APPLY) {
    console.log(`[fresh-start] DRY-RUN complete. No rows deleted. Pass --apply to wipe.`);
    process.exit(0);
  }

  console.log(`[fresh-start] Starting transaction…`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // audit_pii is append-only via Postgres rules — drop them for the wipe,
    // restore inside the same transaction so a rollback puts them back too.
    await client.query(`DROP RULE IF EXISTS audit_pii_no_update ON audit_pii;`);
    await client.query(`DROP RULE IF EXISTS audit_pii_no_delete ON audit_pii;`);

    // Walk dependents -> parents. No FKs in production, but order still
    // matches logical ownership so partial-failure logs are readable.
    const order = [
      `DELETE FROM client_documents`,
      `DELETE FROM client_consent`,
      `DELETE FROM audit_pii`,
      `DELETE FROM clients`,
      `DELETE FROM emails`,
      // Stats: only the event rows tied to advisors. Nothing else writes to
      // this table today, but the WHERE keeps the script safe if that changes.
      `DELETE FROM stats WHERE event_type = 'email_received' OR event_type = 'referral_sent' OR event_type LIKE 'app_access%'`,
      `DELETE FROM advisor_profiles`,
      `DELETE FROM advisors`,
    ];
    const deleted: Record<string, number> = {};
    for (const sql of order) {
      const r = await client.query(sql);
      deleted[sql] = r.rowCount ?? 0;
      console.log(`[fresh-start] ${sql} -> ${r.rowCount} rows`);
    }

    // Re-create the append-only rules so audit_pii is locked down again post-wipe.
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

  // Verify
  console.log(`[fresh-start] Verifying post-wipe counts…`);
  let bad = 0;
  for (const t of TABLES) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    const n = rows[0].n as number;
    const ok = n === 0;
    console.log(`[fresh-start] ${t}: ${n} ${ok ? "OK" : "STILL HAS ROWS"}`);
    if (!ok) bad++;
  }
  if (bad > 0) {
    console.error(`[fresh-start] ${bad} table(s) still hold rows. Investigate.`);
    process.exit(1);
  }

  console.log(`[fresh-start] Done. Reminder: on the deployed VM run`);
  console.log(`              rm -rf uploads/clients/* uploads/scans/*`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[fresh-start] Fatal:`, err);
  process.exit(1);
});
