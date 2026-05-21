import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

// Task #31 — soft-warn duplicate detection on the client side.
// Debounced GET to /api/leads/check-duplicate. Non-blocking — the form can
// always submit. Returns null when no advisor / no usable phone-or-email yet.
// Detail fields (id/name/type/receivedAt) are only present for callers the
// server authorised — public/unauthenticated form fillers get the boolean
// only, so the generic-copy fallback in <DuplicateLeadNotice /> kicks in and
// no lead PII leaks through enumeration.
export type DuplicateLead = {
  id?: number;
  name?: string;
  type?: string;
  receivedAt?: string;
};

export function useDuplicateLeadCheck(
  advisorId: number | undefined,
  phone: string,
  email: string,
): DuplicateLead | null {
  const [duplicate, setDuplicate] = useState<DuplicateLead | null>(null);

  useEffect(() => {
    if (!advisorId) { setDuplicate(null); return; }
    const p = (phone || "").trim();
    const e = (email || "").trim();
    // Same minimum-length floor as the server `findDuplicateLead` helper would
    // realistically match against — avoids chasing every keystroke.
    if (p.length < 7 && e.length < 5) { setDuplicate(null); return; }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ advisorId: String(advisorId) });
        if (p) params.set("phone", p);
        if (e) params.set("email", e);
        const res = await fetch(`/api/leads/check-duplicate?${params}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setDuplicate(data?.duplicate ? data : null);
      } catch { /* aborted or network — non-blocking */ }
    }, 450);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [advisorId, phone, email]);

  return duplicate;
}

// Inline amber notice — works on both dark and light themes without needing
// theme tokens. Renders nothing when there's no duplicate.
export function DuplicateLeadNotice({ duplicate, testId }: { duplicate: DuplicateLead | null; testId?: string }) {
  if (!duplicate) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        color: "#b45309",
        border: "1px solid rgba(245, 158, 11, 0.35)",
      }}
      data-testid={testId || "notice-duplicate-lead"}
    >
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        {duplicate.name ? (
          <>
            Looks like <strong>{duplicate.name}</strong> is already on file
            {duplicate.id ? <> (lead #{duplicate.id}{duplicate.type ? `, ${duplicate.type}` : ""})</> : null}.
            You can still submit — this is just a heads-up so you don't double-log the same contact.
          </>
        ) : (
          <>This contact may already be on file with this advisor. You can still submit if you'd like to send a new request.</>
        )}
      </span>
    </div>
  );
}
