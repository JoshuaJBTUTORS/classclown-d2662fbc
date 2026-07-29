## Goal
Add a reminder/resend icon button next to the existing action buttons on each trial booking row (both grouped and ungrouped views) in `src/pages/TrialBookings.tsx`. Clicking it re-sends the original booking confirmation email/WhatsApp to the parent.

## Changes

1. **`src/pages/TrialBookings.tsx`**
   - Import a bell/send icon (e.g. `BellRing` from lucide-react).
   - Add a new ghost `Button` in the Actions cell for both the grouped rows (~line 488) and the ungrouped rows (~line 579), placed next to the `X` reject button.
   - Button calls a new handler `resendConfirmation(booking)` which:
     - Invokes the existing `send-trial-booking-confirmation` edge function via `supabase.functions.invoke` with the booking's id / details.
     - Shows a sonner toast: "Confirmation resent to {parent_name}" on success, error toast on failure.
     - Uses a loading state per-booking id to disable the button while sending.
   - Tooltip / `title`: "Resend confirmation".

2. **No edge function changes** — `send-trial-booking-confirmation` already exists and is what's fired on original submission; we simply re-invoke it with the same booking payload.

## Out of scope
- No template or copy changes.
- No new DB columns; we don't record resend history for now.
- No changes to WhatsApp logic beyond what the existing confirmation function already does.
