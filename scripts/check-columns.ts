import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const res = await db.execute(
  sql.raw(`SELECT column_name FROM information_schema.columns WHERE table_name = 'advisor_profiles' ORDER BY ordinal_position`)
);
console.log("Columns in advisor_profiles:");
console.log((res as any).rows.map((r: any) => r.column_name).join("\n"));
process.exit(0);
