## Problem

`price_per_lesson` in `draft-proposal-from-transcript` is extracted as a single value with one quote. Discovery calls usually mention several numbers (list price, group vs 1-1 price, discounted price, a price for a different term length). Nothing in the prompt tells the model which one was actually agreed, and the admin only ever sees the one quote the model happened to pick, so a wrong pick is invisible.

## What to build

**1. Price-resolution rules in the system prompt**

Add explicit rules for choosing the settled price:
- The settled price is the LAST price the account manager states that the parent acknowledges or does not push back on — later statements override earlier ones.
- Prefer a price stated together with the term/commitment that is actually being recommended (e.g. the 3-month rate if 3 months was agreed) over prices quoted for other terms.
- Ignore prices that are explicitly framed as: the standard/list rate before a discount, a different lesson type (1-1 vs group) than the one agreed, a hypothetical ("if you did four a week it would be..."), or a competitor's price the parent mentions.
- Convert monthly/weekly totals into a per-lesson figure only when the number of lessons is unambiguous; otherwise keep the per-lesson figure that was said aloud.
- Confidence: `high` only when the parent explicitly confirms the number; `medium` when the account manager states it last and it goes unchallenged; `low` when it was derived, inferred, or several numbers stayed live at the end of the call.

**2. Capture the rejected candidates**

Extend the `price_per_lesson` schema object with a `candidates` array (each item: `value`, `quote`, `timestamp`, `reason_rejected`). The model must list every distinct price figure heard in the call, including the chosen one, with a one-line reason each was or was not selected. Prompt rule: whenever there is more than one candidate, `confidence` may not be `high` unless the parent verbally confirmed the chosen figure.

**3. Surface it in the review dialog**

In `src/components/calendar/TranscriptProposalDialog.tsx`, when `price_per_lesson.candidates` has more than one entry, show a small "Other prices mentioned" list under the price field: each rejected figure with its timestamp, quote and reason, so the admin can one-click swap the price to any candidate before the draft goes to the proposal builder.

**4. Server-side guard**

If the model returns a chosen price that is not present in its own `candidates` list, downgrade its confidence to `low` (same pattern as the existing canonical-subject check) so the admin is prompted to verify.

## Technical notes

- Files: `supabase/functions/draft-proposal-from-transcript/index.ts` (prompt rules, schema, post-processing) and `src/components/calendar/TranscriptProposalDialog.tsx` (candidate list + swap action).
- The schema is strict JSON schema, so `candidates` needs `additionalProperties: false`, all properties in `required`, and nullable rather than optional fields.
- Redeploy the `draft-proposal-from-transcript` edge function after the change.
