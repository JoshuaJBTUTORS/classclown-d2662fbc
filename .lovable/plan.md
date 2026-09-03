# Fix: follow-up reminder emails send parents to a sign-in page

## What's happening

The "Just following up on your lesson proposal" reminder (and its WhatsApp twin) builds the proposal link as:

`https://classclowncrm.com/proposals/<id>`

That address does not exist in the app. The only public proposal addresses are `/proposal/<id>/<token>` and the short `/p/<id>/<token>`, both of which need the proposal's access token. Anything that doesn't match a known public address falls through to the logged-in area of the app, which sends the visitor to `/auth` — which is exactly what the parent saw.

The initial proposal email (`send-proposal-email`) and the expiry reminder both use the correct link, so only the daily follow-up reminder is broken.

## The fix

- Build the reminder link the same way the other proposal emails do: include the proposal's access token and use the public `/proposal/<id>/<token>` path.
- Use that link for both the email and the WhatsApp reminder, and for both the "following up" and "one last step" (agreed) variants.
- Skip sending a reminder for any proposal that has no access token, and log it, rather than sending a link that leads to a sign-in page.
- Safety net: add a redirect so any visit to a `/proposals/<id>` style link (already sitting in parents' inboxes) lands on a friendly page explaining the link is out of date and to use the latest email, instead of a sign-in screen.

## Technical notes

- `supabase/functions/send-daily-reminders/index.ts`: the select already pulls `*`, so `proposal.access_token` is available; change `proposalUrl` to `https://classclowncrm.com/proposal/${proposal.id}/${proposal.access_token}` and guard on a missing token.
- `src/App.tsx`: add a public route for `/proposals/:proposalId` (and `/proposals/:proposalId/*`) ahead of the `/*` protected layout, rendering a small "link expired / please use the newest email" page.
- Redeploy `send-daily-reminders`.
