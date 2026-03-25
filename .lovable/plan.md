

## Update Stripe Publishable Key

Replace the old hardcoded Stripe publishable key with the new one in all 3 frontend files.

### What changes
- **Old key**: `pk_live_51QN38HJvbqr5stJM97b75qtlGHikLcEdXzhPypRqJPKRcZgeYyCztQ6h65rz79HGs1iCgI97GUqUlAUE7vJkGtPk001FSXb648`
- **New key**: `pk_live_51SEUOvJYNQBAYpmilzLd1wW33J3IqSlLE9oEtDWOQuUwP1zjmTSMFW9nWkhattdVpfIbibEyOAwr8IBDaOXgRwve00JjSVVi6U`

### Files modified
1. `src/components/proposals/PaymentCaptureStep.tsx` — proposal payment form
2. `src/components/learningHub/EmbeddedPaymentForm.tsx` — learning hub payment form
3. `src/components/proposals/PaymentSetupStep.tsx` — proposal setup form

Each file has one `loadStripe('pk_live_...')` call where the key gets swapped.

