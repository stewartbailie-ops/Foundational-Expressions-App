// One-shot migration script — recalculates Grader 2.0 fields
// (leadScore, leadTemperature, gradeBreakdown) for every existing email
// using the new weighted scorer. Also refreshes the grade itself so
// older leads stop being stuck on the legacy heuristic.
//
// Run with:  npx tsx scripts/recalculateLeads.ts

import { db } from "../server/db";
import { emails, calculateLeadGrade } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("[Grader 2.0] Recalculating all existing leads…");
  const allEmails = await db.select().from(emails);
  console.log(`[Grader 2.0] Found ${allEmails.length} leads to process.`);

  let updated = 0;
  let unchanged = 0;
  for (const email of allEmails) {
    const result = calculateLeadGrade({
      age: email.clientAge,
      income: email.clientIncome,
      married: email.clientMarried,
      children: email.clientChildren,
      vehicle: email.clientVehicle,
      property: email.clientProperty,
      servicesRequested: email.servicesRequested,
      type: email.type,
      // Task #23 — re-grade with gap fields so historic leads benefit from the
      // richer scoring as soon as advisors backfill or new leads come in.
      netWorthBracket: (email as any).netWorthBracket,
      biggestConcern: (email as any).biggestConcern,
      hasAdvisor: (email as any).hasAdvisor,
      hasWill: (email as any).hasWill,
      estateValueBracket: (email as any).estateValueBracket,
    });

    const breakdownJson = JSON.stringify(result.breakdown);
    // Skip if everything already matches (idempotent re-runs)
    if (
      email.leadScore === result.score &&
      email.leadTemperature === result.temperature &&
      email.gradeBreakdown === breakdownJson &&
      email.grade === result.grade
    ) {
      unchanged++;
      continue;
    }

    await db.update(emails)
      .set({
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: breakdownJson,
      })
      .where(eq(emails.id, email.id));
    updated++;
  }

  console.log(`[Grader 2.0] Done. Updated ${updated}, unchanged ${unchanged}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Grader 2.0] Recalculation failed:", err);
  process.exit(1);
});
