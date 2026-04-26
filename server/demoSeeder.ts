import { storage } from "./storage";
import { autoGradeClient, type InsertEmail } from "@shared/schema";

const FIRST_NAMES = [
  "Thabo", "Sipho", "Lerato", "Nomvula", "Bongani", "Zanele", "Kagiso", "Naledi",
  "Andile", "Palesa", "Mpho", "Refilwe", "Tshepo", "Boitumelo", "Lungile",
  "James", "Sarah", "Michael", "Emma", "David", "Olivia", "Daniel", "Sophia",
  "Ryan", "Chloe", "Liam", "Hannah", "Ethan", "Amelia", "Joshua", "Isabella",
  "Pieter", "Annelie", "Johan", "Marlene", "Hendrik", "Magda", "Stefan", "Karien",
  "Aarav", "Priya", "Rohan", "Aisha", "Imran", "Fatima", "Yusuf", "Layla",
];

const LAST_NAMES = [
  "Nkosi", "Dlamini", "Mokoena", "Sithole", "Khumalo", "Ndlovu", "Mahlangu", "Zulu",
  "Smith", "Jones", "Williams", "Brown", "Taylor", "Anderson", "Wilson", "Moore",
  "van der Merwe", "Botha", "Pretorius", "du Plessis", "Coetzee", "Steyn", "Visser",
  "Naidoo", "Pillay", "Govender", "Reddy", "Singh", "Patel", "Khan", "Moodley",
];

const INDUSTRIES = [
  "IT", "Engineering", "Healthcare", "Education", "Finance", "Retail",
  "Construction", "Mining", "Agriculture", "Tourism", "Manufacturing",
  "Legal", "Marketing", "Government", "Self-employed",
];

// Match the income ranges used by the public-facing forms (CallbackForm, WillForm,
// ReferralForm) so demo leads grade and display the same way real submissions do.
const INCOMES = [
  "R0k - R15k",
  "R15k - R30k",
  "R30k - R45k",
  "R45k - R60k",
  "R60k - R75k",
  "R75k - R100k",
  "R100k+",
];

// Canonical lead types that the rest of the app reads (CIV filters/buckets,
// production write paths in /api/callback, /api/referral, /api/will-request).
// "Call Back" (with the space) matches what /api/callback writes.
const TYPES = ["Call Back", "Referral", "Will Request"] as const;

const REFERRER_RELATIONS = [
  "Family member", "Close friend", "Work colleague", "Neighbour", "Client",
];

const SERVICES = [
  "Retirement planning",
  "Tax-free savings",
  "Investment advice",
  "Estate planning",
  "Life cover review",
  "Education savings",
  "Will drafting",
];

const CONTACT_TIMES = [
  "Mornings (08:00-12:00)",
  "Afternoons (12:00-17:00)",
  "Early evening (17:00-19:00)",
  "Anytime weekdays",
  "Saturday morning",
];

const SUBJECTS_DIRECT = [
  "Looking for advice on retirement",
  "Need help with my investments",
  "Estate planning enquiry",
  "Tax-free savings question",
  "Reviewing my life cover",
];

const BODIES = [
  "Hi, I'd like to chat about my long-term financial planning. Please get in touch when convenient.",
  "Looking for guidance on the best way to structure my savings — would appreciate a call.",
  "A friend mentioned you and I'd love to hear what you can offer. Thanks.",
  "I'm starting a new job next month and want to get my finances in order.",
  "Recently inherited some funds and need professional advice on what to do.",
  "Want to make sure my family is properly covered. Looking forward to chatting.",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe<T>(prob: number, val: T): T | null {
  return Math.random() < prob ? val : null;
}

function fakePhone(): string {
  const prefixes = ["082", "083", "084", "071", "072", "073", "074", "076", "079"];
  const tail = String(pickInt(1000000, 9999999));
  return `${pick(prefixes)}${tail.slice(0, 3)}${tail.slice(3)}`;
}

function fakeEmail(first: string, last: string): string {
  const domains = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "webmail.co.za"];
  const sep = pick(["", ".", "_"]);
  const num = Math.random() < 0.4 ? String(pickInt(1, 99)) : "";
  return `${first.toLowerCase()}${sep}${last.toLowerCase().replace(/[^a-z]/g, "")}${num}@${pick(domains)}`;
}

function buildLead(advisorId: number, slugs: string[] = []): InsertEmail {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const senderName = `${first} ${last}`;
  const senderEmail = fakeEmail(first, last);
  const type = pick(TYPES);
  const age = pickInt(24, 68);
  const income = pick(INCOMES);
  const industry = pick(INDUSTRIES);
  const phone = fakePhone();
  const isReferral = type === "Referral";
  const referrerFirst = isReferral ? pick(FIRST_NAMES) : null;
  const referrerLast = isReferral ? pick(LAST_NAMES) : null;
  const referrerName = referrerFirst && referrerLast ? `${referrerFirst} ${referrerLast}` : null;

  // Spread receivedAt over the last 30 days
  const daysAgo = pickInt(0, 29);
  const hoursAgo = pickInt(0, 23);
  const receivedAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);

  const grade = autoGradeClient(age, income, industry);

  return {
    advisorId,
    senderName,
    senderEmail,
    type,
    grade,
    leadStatus: Math.random() < 0.7 ? "Need to Contact" : (Math.random() < 0.6 ? "Contacted" : "Archive"),
    subject: pick(SUBJECTS_DIRECT),
    body: pick(BODIES),
    clientAge: age,
    clientIncome: income,
    clientIndustry: industry,
    clientPhone: phone,
    clientMarried: Math.random() < 0.55,
    clientChildren: Math.random() < 0.5,
    clientVehicle: Math.random() < 0.75,
    clientProperty: Math.random() < 0.45,
    preferredContactTime: pick(CONTACT_TIMES),
    servicesRequested: pick(SERVICES),
    referrerName,
    referrerEmail: referrerFirst && referrerLast ? fakeEmail(referrerFirst, referrerLast) : null,
    referrerPhone: isReferral ? fakePhone() : null,
    referrerRelation: isReferral ? pick(REFERRER_RELATIONS) : null,
    source:
      type === "Call Back" ? "Callback form" :
      type === "Referral" ? "Referral form" :
      "will-form",
    sourceProfileSlug: slugs.length > 0 ? pick(slugs) : null,
    lastOpenedAt: Math.random() < 0.25 ? new Date() : null,
    receivedAt,
  } as InsertEmail;
}

export async function seedDemoLeadsForAdvisor(advisorId: number, count: number): Promise<number> {
  let added = 0;
  // Pull all profile slugs (primary + secondaries) so demo leads attribute realistically.
  let slugs: string[] = [];
  try {
    const advisor = await storage.getAdvisor(advisorId);
    const profiles = await storage.getAdvisorProfiles(advisorId);
    if (advisor?.profileSlug) slugs.push(advisor.profileSlug);
    for (const p of profiles) if (p.profileSlug) slugs.push(p.profileSlug);
  } catch (err) {
    console.error(`[demoSeeder] Failed to fetch slugs for advisor ${advisorId}:`, err);
  }
  for (let i = 0; i < count; i++) {
    try {
      await storage.createEmail(buildLead(advisorId, slugs));
      added++;
    } catch (err) {
      console.error(`[demoSeeder] Failed to seed lead for advisor ${advisorId}:`, err);
    }
  }
  return added;
}

// Hard cap per demo profile so repeated restarts/top-ups can't pile up forever.
const MAX_LEADS_PER_DEMO = 200;

export async function autoTrickleDemoLeads(perAdvisor: number = 2): Promise<{ advisors: number; leadsAdded: number; skipped: number }> {
  try {
    const all = await storage.getAdvisors();
    const demos = all.filter(a => (a as any).isDemo);
    let total = 0;
    let skipped = 0;
    for (const d of demos) {
      const existing = await storage.getEmailsByAdvisor(d.id);
      const room = MAX_LEADS_PER_DEMO - existing.length;
      if (room <= 0) {
        skipped++;
        continue;
      }
      const toAdd = Math.min(perAdvisor, room);
      total += await seedDemoLeadsForAdvisor(d.id, toAdd);
    }
    return { advisors: demos.length, leadsAdded: total, skipped };
  } catch (err) {
    console.error("[demoSeeder] autoTrickle failed:", err);
    return { advisors: 0, leadsAdded: 0, skipped: 0 };
  }
}
