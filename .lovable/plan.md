# Update trial confirmation templates with device guidance

## What we're changing
Add a friendly, plain-text note to the trial lesson confirmation messages (email and WhatsApp) asking families to join using a laptop or tablet.

## Files to edit
- `supabase/functions/_shared/whatsapp-templates.ts`
  - Add the device note to `trialBookingConfirmation`
- `supabase/functions/send-trial-booking-confirmation/_templates/trial-booking-confirmation-email.tsx`
  - Add the device note to the trial lesson confirmation email body

## Approach
Keep the existing conversational tone, no emojis, and place the note where it feels natural — after the session description and before the “free of charge” reminder.

## Desired wording
"Please try to join using a laptop or tablet if possible, as this gives the best lesson experience for ${childName}."

No other behaviour changes.