import "dotenv/config";
import { db } from "../server/db";
import { advisorProfiles } from "../shared/schema";
import { eq } from "drizzle-orm";

try {
  const rows = await db.select().from(advisorProfiles).where(eq(advisorProfiles.advisorId, 27));
  console.log("Query succeeded. Rows:", rows.length);
} catch (e: any) {
  console.error("Query FAILED:", e.message);
}
process.exit(0);
