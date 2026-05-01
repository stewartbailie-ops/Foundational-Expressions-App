# C's Build Queue — Prioritised Order
*Produced by C (Claude Code) — 2026-04-30*

---

## Immediate — Unblock Friday First

1. **Gold threshold decision** — Grader 2.0 uses 75 as the Gold threshold; original brief said 80. Confirm with Stewart which is correct so Friday's scoring is locked in.

2. **W3.4 logo location audit** — Identify every place in the codebase where the current logo appears so Friday knows exactly what to replace and where. Friday is blocked on this.

---

## Phase 1 — Code & Security

3. **W1.2** — Holistic security audit of the merged stack
   - Review Helmet CSP, rate limiters, session config, upload auth, reCAPTCHA enforcement
   - Check for any routes that should be protected but aren't
   - Produce a short findings report

4. **W2.10** — Audit all submission forms against Grader 2.0 scoring inputs
   - Confirm every field the grader needs (Income, Age, Lifestyle, Services, Source) is actually collected on the relevant forms
   - Flag any gaps so Friday can patch the forms

---

## Phase 2 — Website & Product

5. **W4.4** — Website audit and improvement suggestions
   - Review advisoryconnect.pro against competitors
   - UX, copy, conversion, trust signals
   - Produce a prioritised recommendations list

6. **W4.1** — Pricing tier framework
   - Basic / Pro / Enterprise with SA market benchmarks
   - Revenue model and upgrade triggers
   - Produce a structured brief for Stewart to review

7. **W4.2** — AI integration feasibility brief
   - What AI features make sense for the platform
   - Effort vs impact, realistic build order
   - Produce a short brief

---

## Phase 3 — Pre-Launch

8. **W3.5** — Registry cleanup script
   - Targeted script to remove test/demo data before stress testing
   - Safe, idempotent, admin-triggered only
   - Run this before any load/stress testing begins

---

## Dedicated Session — Documentation

9. **W4.6** — Comprehensive documentation and handover package
   - Full system description for onboarding new developers
   - API reference, environment setup, deployment process
   - Reserved for its own focused session

---

## Open Questions to Resolve with Stewart

- Gold threshold: 75 (Friday's current) or 80 (original brief)?
- Logo files: does Stewart have the new logo assets ready to hand over?
- Budget: what type of budget spreadsheet does Stewart need? (see separate budget file once confirmed)
