import crypto from "crypto";

// Task #26 — Paystack integration (PIVOT from Stripe).
// Why Paystack: Stripe doesn't yet onboard South African businesses. Paystack is
// SA-native, Stripe-owned (acquired Oct 2024), and ZAR-first. Same business
// logic as the original Stripe task — only the SDK + webhook signature format
// differ. See replit.md "Paystack Subscriptions (Task #26)" for the runbook.
//
// We use plain fetch against api.paystack.co instead of a Node SDK because:
//   1. Paystack's official Node SDK is sparse and lags the REST API.
//   2. Fewer transitive deps = smaller esbuild bundle = faster cold start.
//   3. The whole surface we need is four endpoints.

const API_BASE = "https://api.paystack.co";

export type PaystackTier = "basic" | "premium";

function secret(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return k;
}

export function isPaystackConfigured(): boolean {
  // Checkout cannot complete without the secret key AND both plan codes —
  // an advisor clicking "Upgrade" with only the secret key set hits a 502
  // from initializeTransaction (plan code lookup throws). Gate the whole
  // billing surface on all three so we 503 cleanly instead.
  return !!(
    process.env.PAYSTACK_SECRET_KEY &&
    process.env.PAYSTACK_PLAN_BASIC &&
    process.env.PAYSTACK_PLAN_PREMIUM
  );
}

export function planCodeForTier(tier: PaystackTier): string {
  const code = tier === "premium"
    ? process.env.PAYSTACK_PLAN_PREMIUM
    : process.env.PAYSTACK_PLAN_BASIC;
  if (!code) throw new Error(`Paystack plan code for "${tier}" is not configured`);
  return code;
}

// Amount in kobo/cents — Paystack expects the smallest currency unit.
// ZAR cents: R299 = 29900, R499 = 49900.
export function amountForTier(tier: PaystackTier): number {
  return tier === "premium" ? 49900 : 29900;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction(args: {
  email: string;
  tier: PaystackTier;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const body = {
    email: args.email,
    amount: amountForTier(args.tier),
    currency: "ZAR",
    plan: planCodeForTier(args.tier),
    callback_url: args.callbackUrl,
    metadata: {
      ...args.metadata,
      tier: args.tier,
    },
  };
  const res = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as PaystackInitResponse;
  if (!res.ok || !json.status || !json.data) {
    throw new Error(`Paystack initialize failed: ${json.message || res.statusText}`);
  }
  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
  };
}

interface PaystackDisableResponse {
  status: boolean;
  message: string;
}

export async function disableSubscription(args: {
  code: string;
  token: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/subscription/disable`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: args.code, token: args.token }),
  });
  const json = (await res.json()) as PaystackDisableResponse;
  if (!res.ok || !json.status) {
    throw new Error(`Paystack disable failed: ${json.message || res.statusText}`);
  }
}

// Manage-billing link. Paystack doesn't have a Stripe-style hosted Customer
// Portal; the closest equivalent is the "manage subscription" link returned
// by /subscription/:code/manage/link. Returns null if the advisor doesn't yet
// have a Paystack subscription (e.g. still on trial).
export async function getManageSubscriptionLink(code: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/subscription/${code}/manage/link`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret()}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { status: boolean; data?: { link: string } };
  return json.data?.link ?? null;
}

// Webhook signature verification. Paystack signs the request body with
// HMAC-SHA512 using the secret key. The signature is in the `x-paystack-signature`
// header. We compare in constant time. The raw body buffer is supplied by the
// express.json `verify` hook in server/index.ts (req.rawBody).
export function verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return false;
  const computed = crypto
    .createHmac("sha512", key)
    .update(rawBody)
    .digest("hex");
  // timingSafeEqual requires equal length — defensive guard.
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Map a Paystack plan code back to our internal tier value. Driven by env so
// the dashboard's plan codes are the source of truth.
export function tierForPlanCode(planCode: string | undefined | null): "basic" | "premium" | null {
  if (!planCode) return null;
  if (planCode === process.env.PAYSTACK_PLAN_PREMIUM) return "premium";
  if (planCode === process.env.PAYSTACK_PLAN_BASIC) return "basic";
  return null;
}
