import crypto from "crypto";

// Task #25 — AES-256-GCM helper for at-rest PII encryption.
// Key source: process.env.PII_ENCRYPTION_KEY, 32 bytes base64-encoded.
// Wire format for ciphertext: `v1:<base64(iv)>:<base64(ciphertext)>:<base64(tag)>`
// The `v1` prefix lets us migrate to a different cipher/key-format later
// without ambiguity on decrypt.
//
// Loss of PII_ENCRYPTION_KEY = permanent loss of all encrypted client data.
// See replit.md "POPIA / PII Encryption" section for the backup + rotation runbook.

const ALG = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_BYTES = 32;
const PREFIX = "v1";

let cachedKey: Buffer | null = null;
let cachedKeyError: string | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  if (cachedKeyError) throw new Error(cachedKeyError);
  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    const msg =
      "[encryption] PII_ENCRYPTION_KEY is not set. Refusing to encrypt/decrypt PII. " +
      "See replit.md 'POPIA / PII Encryption' for setup and the recovery runbook.";
    cachedKeyError = msg;
    throw new Error(msg);
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    const msg = "[encryption] PII_ENCRYPTION_KEY is not valid base64.";
    cachedKeyError = msg;
    throw new Error(msg);
  }
  if (buf.length !== KEY_BYTES) {
    const msg = `[encryption] PII_ENCRYPTION_KEY must be exactly ${KEY_BYTES} bytes (got ${buf.length}). Generate with: openssl rand -base64 32`;
    cachedKeyError = msg;
    throw new Error(msg);
  }
  cachedKey = buf;
  return buf;
}

export function isEncryptionConfigured(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}

// Distinguishes "no key set yet" (operator hasn't configured it) from
// "key set but invalid" (operator misconfigured it — must fail fast).
// Used by the startup self-test to refuse boot on a bad key while still
// allowing the no-key dev path to come up with a warning.
export function keyStatus(): "missing" | "valid" | "invalid" {
  if (!process.env.PII_ENCRYPTION_KEY) return "missing";
  try {
    loadKey();
    return "valid";
  } catch {
    return "invalid";
  }
}

export function encryptString(plaintext: string): string {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64")}:${ct.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptString(blob: string): string {
  const key = loadKey();
  const parts = blob.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("[encryption] ciphertext format unrecognised");
  }
  const iv = Buffer.from(parts[1], "base64");
  const ct = Buffer.from(parts[2], "base64");
  const tag = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES) throw new Error("[encryption] invalid IV length");
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function encryptBuffer(plaintext: Buffer): Buffer {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // On-disk format: [iv (12)] [tag (16)] [ciphertext (n)]
  return Buffer.concat([iv, tag, ct]);
}

export function decryptBuffer(blob: Buffer): Buffer {
  const key = loadKey();
  if (blob.length < IV_BYTES + 16) throw new Error("[encryption] blob too short");
  const iv = blob.subarray(0, IV_BYTES);
  const tag = blob.subarray(IV_BYTES, IV_BYTES + 16);
  const ct = blob.subarray(IV_BYTES + 16);
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

// Round-trip self-test. Run at startup when the key is configured so a
// misconfigured key fails loudly instead of silently corrupting writes.
export function selfTest(): { ok: boolean; error?: string } {
  try {
    const sample = "popia-self-test:" + crypto.randomBytes(8).toString("hex");
    const enc = encryptString(sample);
    const dec = decryptString(enc);
    if (dec !== sample) return { ok: false, error: "round-trip mismatch" };
    const buf = crypto.randomBytes(64);
    const bdec = decryptBuffer(encryptBuffer(buf));
    if (!buf.equals(bdec)) return { ok: false, error: "buffer round-trip mismatch" };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}
