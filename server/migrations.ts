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
  try {
    for (const [col, def] of ADVISOR_PROFILE_COLUMNS) {
      await db.execute(
        sql.raw(`ALTER TABLE advisor_profiles ADD COLUMN IF NOT EXISTS ${col} ${def}`)
      );
    }
    console.log("[migrations] advisor_profiles columns verified");
  } catch (err) {
    // Non-fatal: columns likely already exist. Log and continue so the server starts.
    console.warn("[migrations] startup migration warning (non-fatal):", err);
  }
}
