import { db } from "./db";
import { sql } from "drizzle-orm";

// Idempotent column additions — safe to run on every startup.
// Each ALTER TABLE uses IF NOT EXISTS so it's a no-op when the column already exists.
const ADVISOR_PROFILE_COLUMNS: [string, string][] = [
  ["show_second_news",         "boolean NOT NULL DEFAULT false"],
  ["show_forex",               "boolean NOT NULL DEFAULT false"],
  ["show_fun_facts",           "boolean NOT NULL DEFAULT false"],
  ["show_liberty",             "boolean NOT NULL DEFAULT false"],
  ["show_stanlib",             "boolean NOT NULL DEFAULT false"],
  ["show_signinghub",          "boolean NOT NULL DEFAULT false"],
  ["show_showpiece_inflation", "boolean NOT NULL DEFAULT true"],
  ["show_showpiece_waiting",   "boolean NOT NULL DEFAULT true"],
  ["show_tool_bond",           "boolean NOT NULL DEFAULT true"],
  ["show_tool_emergency",      "boolean NOT NULL DEFAULT true"],
  ["show_tool_life_cover",     "boolean NOT NULL DEFAULT true"],
  ["show_tool_debt",           "boolean NOT NULL DEFAULT true"],
  // W1 T3: My Email platform toggle. Opt-in default — advisors must enable it.
  ["show_my_email",            "boolean NOT NULL DEFAULT false"],
];

// Lead-table additive columns. Same pattern, separate list because the parent
// table is `emails`, not advisors/advisor_profiles.
const EMAILS_COLUMNS: [string, string][] = [
  // W1 T9: soft-warn duplicate lead detection. Nullable; points at prior lead id.
  ["duplicate_of_id", "integer"],
  // Task #23 — grader gap fields from Chris's 15 May meeting. All nullable.
  ["how_found",             "text"],
  ["net_worth_bracket",     "text"],
  ["biggest_concern",       "text"],
  ["has_advisor",           "boolean"],
  ["existing_advisor_name", "text"],
  ["referral_reason",       "text"],
  ["has_will",              "boolean"],
  ["estate_value_bracket",  "text"],
];

type ExistsRow = { exists: boolean | null };

export async function runStartupMigrations() {
  // Confirm the parent table exists before issuing ALTERs. This gives a clear,
  // untruncated diagnostic in production logs if the database doesn't yet
  // have the schema (drizzle-kit push hasn't been run against this URL),
  // instead of a minified drizzle stack trace dump. We then throw so the
  // process fails fast — startup must not silently continue with a known
  // schema mismatch, or the app will 500 on every advisor route at runtime.
  const result = await db.execute<ExistsRow>(
    sql.raw(`SELECT to_regclass('public.advisor_profiles') IS NOT NULL AS exists`)
  );
  const tableExists = !!result.rows?.[0]?.exists;
  if (!tableExists) {
    throw new Error(
      "[migrations] advisor_profiles table is missing. Run `npm run db:push` " +
        "against this DATABASE_URL before starting the server."
    );
  }

  for (const [col, def] of ADVISOR_PROFILE_COLUMNS) {
    await db.execute(
      sql.raw(`ALTER TABLE advisor_profiles ADD COLUMN IF NOT EXISTS ${col} ${def}`)
    );
  }
  console.log("[migrations] advisor_profiles columns verified");

  // Same new columns on the advisors table (primary profiles share the same toggle set).
  for (const [col, def] of ADVISOR_PROFILE_COLUMNS) {
    await db.execute(
      sql.raw(`ALTER TABLE advisors ADD COLUMN IF NOT EXISTS ${col} ${def}`)
    );
  }
  console.log("[migrations] advisors columns verified");

  for (const [col, def] of EMAILS_COLUMNS) {
    await db.execute(
      sql.raw(`ALTER TABLE emails ADD COLUMN IF NOT EXISTS ${col} ${def}`)
    );
  }
  console.log("[migrations] emails columns verified");

  // Session table for connect-pg-simple. We create it here (instead of
  // relying on connect-pg-simple's createTableIfMissing) because that
  // option reads node_modules/connect-pg-simple/table.sql at runtime,
  // which esbuild does NOT include in dist/index.cjs — production then
  // crashes with ENOENT on /dist/table.sql the first time a session is
  // saved (i.e. on first login). Schema mirrors connect-pg-simple's
  // own table.sql exactly so the store reads/writes work unchanged.
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);
  `));
  await db.execute(sql.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
      ) THEN
        ALTER TABLE "session"
          ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
          NOT DEFERRABLE INITIALLY IMMEDIATE;
      END IF;
    END$$;
  `));
  await db.execute(sql.raw(
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`
  ));
  console.log("[migrations] session table verified");

  // Task #24 — login audit table. Records every admin + advisor login attempt
  // with IP + user-agent so we can spot brute-force activity and feed the
  // PII-audit work that follows. Created via CREATE TABLE IF NOT EXISTS rather
  // than ALTER (new table, no risk of column conflicts).
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "login_audit" (
      "id" serial PRIMARY KEY,
      "role" text NOT NULL,
      "advisor_id" integer,
      "email_attempted" text,
      "slug" text,
      "outcome" text NOT NULL,
      "ip_address" text,
      "user_agent" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `));
  await db.execute(sql.raw(
    `CREATE INDEX IF NOT EXISTS "IDX_login_audit_created" ON "login_audit" ("created_at");`
  ));
  await db.execute(sql.raw(
    `CREATE INDEX IF NOT EXISTS "IDX_login_audit_advisor" ON "login_audit" ("advisor_id");`
  ));
  console.log("[migrations] login_audit table verified");
}
