import { db } from "./db";
import { sql } from "drizzle-orm";

// Idempotent column additions — safe to run on every startup.
// Each ALTER TABLE uses IF NOT EXISTS so it's a no-op when the column already exists.
const ADVISOR_PROFILE_COLUMNS: [string, string][] = [
  ["show_second_news", "boolean NOT NULL DEFAULT false"],
  ["show_forex",       "boolean NOT NULL DEFAULT false"],
  ["show_fun_facts",   "boolean NOT NULL DEFAULT false"],
  ["show_liberty",     "boolean NOT NULL DEFAULT false"],
  ["show_stanlib",     "boolean NOT NULL DEFAULT false"],
  ["show_signinghub",  "boolean NOT NULL DEFAULT false"],
];

export async function runStartupMigrations() {
  // Confirm the parent table exists before attempting any ALTERs. If it
  // doesn't (e.g. a brand-new database that hasn't had drizzle-kit push run),
  // we log a clear, untruncated message and continue — the rest of the
  // startup path can still come up so the deploy port opens and the platform
  // doesn't kill the container before we get any visibility.
  let tableExists = false;
  try {
    const result: any = await db.execute(
      sql.raw(
        `SELECT to_regclass('public.advisor_profiles') IS NOT NULL AS exists`
      )
    );
    tableExists = !!(result?.rows?.[0]?.exists ?? result?.[0]?.exists);
  } catch (err) {
    console.error(
      "[migrations] FATAL: could not check advisor_profiles existence — DB connection problem?",
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    );
    return;
  }

  if (!tableExists) {
    console.error(
      "[migrations] SKIPPED: advisor_profiles table does not exist in this database. " +
        "Run `npm run db:push` against this DATABASE_URL before relying on secondary profiles."
    );
    return;
  }

  for (const [col, def] of ADVISOR_PROFILE_COLUMNS) {
    try {
      await db.execute(
        sql.raw(`ALTER TABLE advisor_profiles ADD COLUMN IF NOT EXISTS ${col} ${def}`)
      );
    } catch (err) {
      // Surface the EXACT failure clearly in deploy logs (not buried under
      // a minified bundle stack trace) so the next incident is diagnosable.
      console.error(
        `[migrations] FAILED to add column ${col}:`,
        err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      );
    }
  }
  console.log("[migrations] advisor_profiles columns verified");
}
