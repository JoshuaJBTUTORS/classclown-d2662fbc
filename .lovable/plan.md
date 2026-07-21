## Goal

Rewrite the lesson proposal notification templates (email + WhatsApp) so they read like a natural, calm message from a person rather than a marketing blast. Strip all emojis and remove hyphens/em-dashes/en-dashes from the copy, matching the tone we already applied to the trial lesson notifications.

## Files to update

**WhatsApp** — `supabase/functions/_shared/whatsapp-templates.ts`
- `proposalNotification` (sent when a proposal is first emailed)
- `proposalReminder` (daily reminder for sent/viewed proposals)
- `proposalAgreedReminder` (daily reminder for proposals in "agreed" status awaiting payment setup)

**Email templates**
- `supabase/functions/send-proposal-email/_templates/proposal-email.tsx` — initial proposal email
- `supabase/functions/send-daily-reminders/_templates/reminder-email.tsx` — sent/viewed reminder
- `supabase/functions/send-daily-reminders/_templates/agreed-reminder-email.tsx` — agreed reminder

**Subject lines / trigger files**
- `supabase/functions/send-daily-reminders/index.ts` — strip emojis from the two subject lines (`⏰ Complete Your Proposal...`, `📢 Reminder: Your Lesson Proposal...`)
- `supabase/functions/send-proposal-email/index.ts` — subject already clean, no change needed

## Tone rules applied (same as trial notifications)

- No emojis anywhere (subjects, headings, bullets, sign-offs).
- No hyphens, em-dashes, or en-dashes in copy. Rewrite phrases like "one-to-one", "sign-up", "Month-to-month" so they either use a space or a comma. Replace decorative dashes with commas or full stops.
- Conversational opener ("Hi {Name}, hope you're well.") rather than "Dear" or "🎉".
- Remove marketing bullet lists ("What's included", "Secure your spot", "Building confidence, one lesson at a time"). Fold the key point into a short paragraph instead.
- Keep the essential info: who it's from, that a proposal is ready / awaiting review / awaiting payment setup, and the link.
- Sign off simply, e.g. "Thanks, Joshua — Class Beyond Academy" written without a dash, e.g. "Thanks, Joshua. Class Beyond Academy." Contact phone `01438 582848` where appropriate (matching the trial templates).
- Keep existing props/signatures and React Email component structure; only the copy and inline styles-for-decoration change (drop any leftover emoji characters in heading strings).

## Out of scope

- No logic, routing, scheduling, or database changes.
- No changes to the `complete-proposal-setup` admin notification emails (those are internal, not customer-facing).
- No visual redesign of the email shell beyond removing decorative emoji glyphs from headings.
