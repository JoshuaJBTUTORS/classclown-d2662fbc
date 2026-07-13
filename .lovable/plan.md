## Goal

Rebuild `/proposal/:id/:token` (`src/pages/ProposalView.tsx`) to match the Sprint Education proposal format: fixed left sidebar navigation, top action bar, personalised hero, "Prepared by" card, embedded intro video, and long scrolling content split into 7 anchored sections.

Design system stays on Class Beyond's Premium Teal tokens (Plus Jakarta Sans headings, Inter body, deep teal primary). No emojis anywhere. Agreement + Payment steps and data loading are untouched — only the `currentStep === 'view'` UI changes.

## Layout

```text
+-----------------+---------------------------------------------------+
| Class Beyond    |  PROPOSAL REF  CB-xxxxxxxx        [Contact] [Confirm]
|  logo           |                                                   |
| PROPOSAL        |  A tailored plan for                              |
| [Recipient]     |  Joshua Ekundayo                                  |
|                 |                                                   |
| ▸ Overview      |  [Prepared by card: photo, name, email, phone,    |
|   The Plan      |   date]                                           |
|   What's Incl.  |                                                   |
|   Results       |  [Personal video block: shared intro, play btn]   |
|   Pricing       |                                                   |
|   FAQs          |  [Key stats row: lessons/term · hours · subjects] |
|   Terms         |                                                   |
|                 |  === The Plan ===                                 |
|                 |  === What's Included ===  ... etc                 |
+-----------------+---------------------------------------------------+
```

- Left sidebar: fixed on desktop (≥lg), collapses to a top sticky pill-nav on mobile. Each item is an anchor link that scrolls to its section and highlights on scroll via `IntersectionObserver`.
- Top action bar: right-aligned buttons — "Contact us" (mailto), "Print" (`window.print()`), primary "Confirm & get started" (opens existing AgreementStep flow — no logic change).
- Content column: max-width ~720px, generous vertical spacing between sections, thin divider rules, section labels in uppercase micro-caps above each H2.

## Sections (7)

1. **Overview** — Personalised hero "A tailored plan for {recipient_name}", intro paragraph, Prepared-by card (fixed: Class Beyond BD team, `enquiries@classbeyondacademy.io`, `01438 582848`, today's date), shared intro video block, key stats row (weekly lesson count, minutes/week, subjects).
2. **The Plan** — Lesson times table (day / time / duration / subject) rendered as a clean grid instead of the current bulleted paragraph.
3. **What's Included** — Existing 5 bullets (recordings, learning hub, dashboard, half-termly assessments, marked homework) as a 2-column checklist.
4. **Results** — 3 stat cards (92% A*/A, 95% 11+ pass, 98% satisfaction) restyled to match Sprint's clean stat blocks (no gradients, big numeric, small caption).
5. **Pricing** — Price per lesson, payment cycle, plus the daily-homework add-on card (opt-in behaviour identical to today).
6. **FAQs** — Accordion (shadcn `Accordion`) with 5–6 common parent questions. Content hardcoded for now.
7. **Terms** — Short plain-text T&Cs block (safeguarding, cancellation notice, payment terms).

Bottom: sticky "Confirm & get started" bar on mobile; inline CTA at end of Terms on desktop.

## Files

- `src/pages/ProposalView.tsx` — replace the `view`-step markup only. Extract the new UI into `src/components/proposals/ProposalLayout.tsx` plus one file per section under `src/components/proposals/sections/` (Overview, Plan, Included, Results, Pricing, Faqs, Terms) to keep files small.
- `src/components/proposals/ProposalSidebar.tsx` — sidebar nav + scroll-spy hook.
- `src/components/proposals/ProposalTopBar.tsx` — action bar.
- `src/components/proposals/PreparedByCard.tsx` — fixed Class Beyond BD card, uses a small headshot/monogram from `src/assets`.
- `src/components/proposals/IntroVideo.tsx` — 16:9 embed of one shared video (URL as a constant at top of file, easy to change later).
- No DB changes, no edge-function changes, no changes to Agreement or Payment steps.

## Design tokens

- Reuse existing Premium Teal tokens; add two if missing: `--proposal-rule` (light divider) and `--proposal-muted-bg` (very subtle tint for stat cards) in `src/index.css`.
- No hardcoded colors in components; all through Tailwind semantic classes.
- Zero emojis anywhere in the new UI (per project memory).

## Out of scope

- Admin-side proposal builder edits.
- Per-proposal custom video, tutor bio, or About Us section (deferred — user picked Core 7).
- Any change to auth, RLS, edge functions, agreement flow, or payment capture.

## Verification

After build: use Playwright headless to load `/proposal/aa307550-…/43dd3901-…` at 1280×1800, screenshot, and confirm sidebar + hero + stats + all 7 sections render and the "Confirm & get started" button still routes into AgreementStep.
