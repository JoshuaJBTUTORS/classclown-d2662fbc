## Root cause

Every other email function in the project (trial booking confirmation, trial lesson approval, proposal email, lesson reminders, password reset, complete-proposal-setup, etc.) sends via the Resend SDK directly:

```ts
import { Resend } from "npm:resend";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
await resend.emails.send({ from, to, subject, html });
```

`send-welcome-email` is the odd one out — it was rewritten to call the Lovable connector gateway (`https://connector-gateway.lovable.dev/resend/emails` with `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: RESEND_API_KEY`). The stored `RESEND_API_KEY` secret in this project is a plain Resend API key, not a Lovable connector-gateway key, so the gateway returns `401 Credential not found`. That is exactly the error we saw in the logs on the latest test.

## Fix

Rewrite `supabase/functions/send-welcome-email/index.ts` to use the same pattern as every other working email function:

1. Import `Resend` from `npm:resend`.
2. Instantiate with `Deno.env.get("RESEND_API_KEY")`.
3. Call `resend.emails.send({ from: "Hannah <hannah@classbeyondacademy.io>", to: [parentEmail], reply_to: "hannah@classbeyondacademy.io", subject, html, text })`.
4. Keep the existing HTML/text body, subject, and payload shape unchanged.
5. Keep CORS handling and the current input validation.
6. Return `{ success: true, id: data?.id }` on success, and the Resend error payload with the returned status on failure (mirroring how `send-trial-booking-confirmation` reports errors).

No other files change. `verify_jwt = false` in `supabase/config.toml` stays as is so the onboarding fire-and-forget call still reaches the function.

## Verification

- Deploy `send-welcome-email`.
- Trigger it from the onboarding Step 3 flow (or a direct curl with a test payload to a safe inbox).
- Confirm the edge function logs show a `200` from Resend and no more `Credential not found`.
