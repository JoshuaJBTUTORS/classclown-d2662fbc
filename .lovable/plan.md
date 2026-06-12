## Fix CORS / deploy failure for `send-tutor-offer`

The edge function isn't deploying because the email template lives in a `_templates/` subfolder. Lovable edge functions must keep all code in `index.ts`.

### Changes
1. Inline the `TutorOfferEmail` React Email component (and its styles) directly into `supabase/functions/send-tutor-offer/index.ts`.
2. Delete `supabase/functions/send-tutor-offer/_templates/tutor-offer-email.tsx` and the `_templates` folder.
3. Trigger redeploy of `send-tutor-offer`.

No DB or frontend changes.