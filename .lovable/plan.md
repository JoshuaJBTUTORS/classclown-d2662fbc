## Add confirmation popup before Submit Request

When the user clicks **Submit Request** on the trial booking page (`/book-trial`), show an AlertDialog with a courtesy message. The actual booking only submits after the user confirms in the dialog.

### Behaviour

1. Click **Submit Request** → open confirmation dialog (no network call yet).
2. Dialog shows:
   > Thank you for considering Class Beyond Academy.
   >
   > We're pleased to offer you a free trial lesson. Although there is no cost to you, your tutor sets aside this time especially for your child. We kindly ask that you only book a time that you are confident you can attend, so that no tutor time goes to waste and we can continue offering free trial lessons to other families.
   >
   > Thank you for your understanding, and we look forward to welcoming you!
3. Buttons: **Cancel** (closes dialog, no submission) and **Confirm Booking** (runs the existing `handleSubmit`).
4. Existing loading state, toast, and confirmation redirect behaviour stay unchanged.

### Technical

- File: `src/pages/TrialBooking.tsx`.
- Add `showConfirmDialog` state. `Submit Request` button now sets it to `true` instead of calling `handleSubmit` directly.
- Render `AlertDialog` from `@/components/ui/alert-dialog` with the message above. On `AlertDialogAction` click, close dialog and call existing `handleSubmit`.
- Keep the pink brand colour (`#e94b7f`) on the confirm button to match the page styling.
- No changes to `trialBookingService` or backend logic.
