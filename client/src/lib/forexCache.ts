// W1 T1: Shared forex rate cache. Both AdvisorPanel and AdvisorProfile used to
// independently hit https://open.er-api.com/v6/latest/<base> on mount, plus the
// ForexWidget hits /api/forex/rates separately. With the inline calculator on
// the same page (and again when an advisor previews their own profile in the
// panel) that meant two simultaneous external calls per render.
//
// This module deduplicates by base currency with a 60s TTL. Concurrent callers
// within the TTL share a single in-flight promise so we never fire twice for
// the same base in the same tick.
const CACHE_TTL_MS = 60_000;

type Rates = Record<string, number>;
type CacheEntry = { ts: number; rates: Rates };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Rates>>();

export async function getForexRates(base: string): Promise<Rates> {
  const key = base.toUpperCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.rates;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${key}`);
      const data = await res.json();
      if (data?.result === "success" && data.rates) {
        const rates = data.rates as Rates;
        cache.set(key, { ts: Date.now(), rates });
        return rates;
      }
      return {} as Rates;
    } catch {
      return {} as Rates;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
