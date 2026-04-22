import { argv } from "node:process";

const BASE = process.env.SEED_BASE_URL || "https://app.advisoryconnect.pro";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@advisoryconnect.pro";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADVISOR_ID = Number(process.env.SEED_ADVISOR_ID || 24);

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD env var required.");
  process.exit(1);
}

const FIRST = ["Lerato","Sipho","Thandi","Nomvula","Bongani","Khanyi","Tshepo","Naledi","Karabo","Mpho","Aisha","Faisal","Yusuf","Zara","Ahmed","Pieter","Hendrik","Annelie","Marius","Susanna","James","Sarah","Michael","Emma","David","Olivia","Daniel","Charlotte","Liam","Zinhle"];
const LAST = ["Naidoo","Patel","Khumalo","Dlamini","Mokoena","Van der Merwe","Botha","Pretorius","Du Toit","Kruger","Smith","Jones","Williams","Brown","Taylor","Mahlangu","Ndlovu","Mthembu","Sithole","Ngcobo"];
const INDUSTRIES = ["Mining","Finance","IT","Healthcare","Education","Retail","Manufacturing","Construction","Legal","Agriculture"];
const INCOMES = ["R20k - R40k","R40k - R60k","R60k - R80k","R80k - R120k","R120k+"];
const SERVICES_LIST = ["Retirement Planning","Investment Advice","Risk Cover","Estate Planning","Tax Optimisation","Medical Aid","Education Funding"];
const CONTACT_TIMES = ["Morning (8-12)","Afternoon (12-17)","Evening (17-19)","Anytime"];
const RELATIONS = ["Friend","Colleague","Family","Neighbour","Client"];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randBool = () => Math.random() > 0.5;
const fullName = () => `${rand(FIRST)} ${rand(LAST)}`;
const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, ".");
const emailFor = (n) => `${slug(n)}.${randInt(10,999)}@example.test`;
const phone = () => `+2782${randInt(1000000, 9999999)}`;

// Spread across past 14 days. Generate 30 evenly-distributed timestamps.
function generateTimestamps(count, days) {
  const now = Date.now();
  const span = days * 24 * 60 * 60 * 1000;
  const stamps = [];
  for (let i = 0; i < count; i++) {
    // Even base + jitter so they aren't perfectly evenly spaced
    const base = now - span + (i / (count - 1)) * span;
    const jitter = (Math.random() - 0.5) * (span / count);
    stamps.push(new Date(base + jitter));
  }
  // Sort ascending then shuffle the type assignment so dates are mixed with types
  stamps.sort((a, b) => a - b);
  return stamps;
}

function makeReferral(advisorId, receivedAt) {
  const name = fullName();
  const industry = rand(INDUSTRIES);
  return {
    advisorId,
    senderName: name,
    senderEmail: emailFor(name),
    type: "Referral",
    subject: `Referral from advisor app`,
    body: `Looking for advice on ${rand(SERVICES_LIST).toLowerCase()}.`,
    clientAge: randInt(25, 65),
    clientIncome: rand(INCOMES),
    clientIndustry: industry,
    clientPhone: phone(),
    clientMarried: randBool(),
    clientChildren: randBool(),
    clientVehicle: randBool(),
    clientProperty: randBool(),
    preferredContactTime: rand(CONTACT_TIMES),
    servicesRequested: rand(SERVICES_LIST),
    referrerName: fullName(),
    referrerEmail: emailFor(fullName()),
    referrerPhone: phone(),
    referrerRelation: rand(RELATIONS),
    source: "advisor app",
    receivedAt: receivedAt.toISOString(),
  };
}

function makeCallback(advisorId, receivedAt) {
  const name = fullName();
  return {
    advisorId,
    senderName: name,
    senderEmail: emailFor(name),
    type: "Call Back",
    subject: `Call back request from advisor app`,
    body: `Please call me about ${rand(SERVICES_LIST).toLowerCase()}.`,
    clientAge: randInt(25, 65),
    clientIncome: rand(INCOMES),
    clientIndustry: rand(INDUSTRIES),
    clientPhone: phone(),
    clientMarried: randBool(),
    clientChildren: randBool(),
    clientVehicle: randBool(),
    clientProperty: randBool(),
    preferredContactTime: rand(CONTACT_TIMES),
    servicesRequested: rand(SERVICES_LIST),
    source: "advisor app",
    receivedAt: receivedAt.toISOString(),
  };
}

function makeWill(advisorId, receivedAt) {
  const name = fullName();
  const married = randBool();
  const children = randInt(0, 4);
  return {
    advisorId,
    senderName: name,
    senderEmail: emailFor(name),
    type: "Will Request",
    subject: `Will request from advisor app`,
    body: [
      `ID: ${randInt(7000000000000, 9999999999999)}`,
      `DOB: 19${randInt(60, 99)}-0${randInt(1, 9)}-1${randInt(0, 9)}`,
      `Marital Status: ${married ? "Married" : "Single"}`,
      married ? `Spouse: ${fullName()}` : null,
      `Children: ${children}`,
    ].filter(Boolean).join(" | "),
    clientPhone: phone(),
    clientMarried: married,
    clientChildren: children > 0,
    source: "advisor app",
    receivedAt: receivedAt.toISOString(),
  };
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Login failed: ${res.status} ${t}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No session cookie returned from login");
  // Extract just the connect.sid=... portion
  const cookie = setCookie.split(";")[0];
  return cookie;
}

async function postEmail(cookie, payload) {
  const res = await fetch(`${BASE}/api/emails`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`POST /api/emails failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function main() {
  const total = 30;
  const days = 14;
  console.log(`Seeding ${total} backdated leads spread over ${days} days against ${BASE} (advisor ${ADVISOR_ID})...`);

  const cookie = await login();
  console.log("✓ Admin login OK");

  const stamps = generateTimestamps(total, days);
  // Build a balanced spread: 10 referrals, 10 callbacks, 10 wills, interleaved.
  const types = [];
  for (let i = 0; i < 10; i++) types.push("Referral", "Call Back", "Will Request");
  // Shuffle types so they distribute across the date range
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  let okCount = 0;
  for (let i = 0; i < total; i++) {
    const t = types[i];
    const stamp = stamps[i];
    const payload =
      t === "Referral" ? makeReferral(ADVISOR_ID, stamp) :
      t === "Call Back" ? makeCallback(ADVISOR_ID, stamp) :
      makeWill(ADVISOR_ID, stamp);
    try {
      const created = await postEmail(cookie, payload);
      okCount++;
      console.log(`  [${String(i + 1).padStart(2, "0")}/${total}] ${t.padEnd(12)} id=${created.id}  ${stamp.toISOString().slice(0, 16).replace("T", " ")}  ${payload.senderName}`);
    } catch (err) {
      console.error(`  [${String(i + 1).padStart(2, "0")}/${total}] FAILED:`, err.message);
    }
    // Small pacing
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\nDone. ${okCount}/${total} leads created.`);
}

main().catch(err => { console.error(err); process.exit(1); });
