import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// pg-connection-string v2.x now treats sslmode=require/prefer/verify-ca as
// verify-full, which validates the DB certificate against the system CA store.
// Replit/Neon-style managed Postgres certs are not in the system trust store,
// so the pool throws on first query and crashes the process before the port
// opens. We restore the prior "encrypted but don't verify the cert chain"
// behaviour by passing ssl explicitly. Local dev DBs that don't speak SSL
// ignore this option.
const useSsl = /sslmode=(require|prefer|verify-ca|verify-full)/i.test(process.env.DATABASE_URL);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const db = drizzle(pool, { schema });
