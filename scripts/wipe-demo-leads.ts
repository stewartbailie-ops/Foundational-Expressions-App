import "dotenv/config";
import { db } from "../server/db";
import { advisors, emails } from "../shared/schema";
import { eq, count } from "drizzle-orm";

const targetSlug = process.argv[2];

const demoAdvisors = await db
  .select({ id: advisors.id, name: advisors.name, slug: advisors.profileSlug })
  .from(advisors)
  .where(eq(advisors.isDemo, true));

if (demoAdvisors.length === 0) {
  console.log("No demo advisors found.");
  process.exit(0);
}

console.log("\nDemo advisors:\n");
for (const a of demoAdvisors) {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(emails)
    .where(eq(emails.advisorId, a.id));
  console.log(`  ID ${a.id}  slug: ${a.slug.padEnd(30)}  name: ${a.name}  leads: ${cnt}`);
}

if (!targetSlug) {
  console.log("\nTo wipe leads, run:  tsx scripts/wipe-demo-leads.ts <slug>\n");
  process.exit(0);
}

const target = demoAdvisors.find(a => a.slug === targetSlug);
if (!target) {
  console.error(`\nNo demo advisor found with slug "${targetSlug}"\n`);
  process.exit(1);
}

const deleted = await db.delete(emails).where(eq(emails.advisorId, target.id));
console.log(`\nDeleted all leads for "${target.name}" (ID ${target.id}, slug: ${target.slug})\n`);
process.exit(0);
