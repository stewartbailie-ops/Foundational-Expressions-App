# Friday's Build Queue — Prioritised Order
*Produced by C (Claude Code) — 2026-04-30*
*Original backlog: see friday-backlog-original.md*

---

## Phase 1 — Quick Wins
*Self-contained, no dependencies, start here*

1. **W2.9** — Lead temperature glowing trim (Hot = red, Warm = yellow, Cold = blue)
   - Data already in DB from Grader 2.0, pure CSS/visual — zero risk

2. **W2.7** — CSV lead export
   - Simple backend route + button, no dependencies

3. **W3.7** — Registry search/sort enhancements (double-click sort, date range filter, unread indicators)
   - Enhances existing table, no schema changes needed

4. **W1.3** — Bundle size / code splitting
   - Pure performance improvement, no user-facing risk

---

## Phase 2 — Lead Registry Deep Work
*Do in this order — each builds on the last*

5. **W2.6** — Enhanced timestamps (firstViewedAt, lastSharedAt)
   - DB migration first — must land before archiving or indicators reference these fields

6. **W2.5** — Lead Registry archiving tab
   - Depends on timestamps being in place for "archived on" display

7. **W3.6** — Grader 2.0 indicators on sub-profiles
   - Depends on score/grade/temperature being reliably stored (confirmed from Grader 2.0 work)

---

## Phase 3 — Contact Card & Profile Polish

8. **W3.1** — Profile button area cleanup / grouping
   - Do before contact card work so layout is settled

9. **W3.2** — Contact card platform toggles
   - Builds on clean button area from W3.1

10. **W2.8** — "Add to Home Screen" prompt / link in advisor panel
    - Short task, fits naturally after contact card polish

---

## Phase 4 — Content Features

11. **W2.3** — Daily financial fun facts
    - 6 randomised per day from a pool of 300, shown on advisor contact cards
    - Styled like Financial Tip Tuesday / Wills Wednesday / Monday Motivation cards Stewart shared
    - Dark teal / sage green cards, quote + category label format
    - Advisors can copy/share to socials and WhatsApp status

12. **W2.1** — Forex / exchange rate indicator widget

13. **W2.2** — Secondary news feed option

---

## Phase 5 — Visual Design
*Highest blast radius — do after everything else is stable*

14. **W3.3** — Additional colour palettes and background themes
    - Touches entire UI — leave until the rest is settled

15. **W3.4** — New logo integration
    - **Blocked:** waiting on C to confirm exact placement locations — do not start until C gives the go-ahead

---

## Phase 6 — Infrastructure

16. **W1.4** — CSP report-uri monitoring endpoint

17. **W1.5** — Play Store TWA via PWABuilder + assetlinks.json
    - Icons done, manifest done — this is the final step before Play Store submission

---

## Deferred — Needs Design Brief First

- **W2.4** — "Book of Life" client portal (promote lead → client, upload policies)
- **W4.3** — Client onboarding flow
- **W4.5** — Localisation / wording audit (ongoing, not a sprint task)

---

*Tip for Stewart: Share Phase 1 with Friday first. Once she's through those four, send Phase 2. No need to hand her the full list at once.*
