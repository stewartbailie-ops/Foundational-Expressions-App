import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const columns = [
  "show_second_news",
  "show_forex",
  "show_fun_facts",
  "show_liberty",
  "show_stanlib",
  "show_signinghub",
];

for (const col of columns) {
  try {
    await db.execute(sql.raw(`ALTER TABLE advisor_profiles ADD COLUMN IF NOT EXISTS ${col} boolean NOT NULL DEFAULT false`));
    console.log(`✓ ${col}`);
  } catch (err: any) {
    console.error(`✗ ${col}: ${err.message}`);
  }
}

console.log("\nDone.");
process.exit(0);
