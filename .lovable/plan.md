

## Update Card Details Page

Create a standalone public page where customers can update their card details via a secure link. Reuses the same Stripe SetupIntent pattern as the proposal payment step.

### What gets built

**1. New page: `src/pages/UpdateCardDetails.tsx`**
- Route: `/update-card/:customerId/:token`
- Identical layout to `PaymentCaptureStep` but with updated copy:
  - Title: "Update Card" (with CreditCard icon instead of CheckCircle)
  - Subtitle: "As part of our routine annual payment method check, please update your payment details using the secure link below."
  - Button: "Update Card Details" instead of "Complete Sign-Up"
  - Remove the "£0.00 Authorization" box
- On load, calls a new edge function to create a SetupIntent for the existing Stripe customer
- On success, calls another edge function to attach the new payment method and update stored records
- Shows a success confirmation screen after completion

**2. New edge function: `supabase/functions/create-card-update-setup-intent/index.ts`**
- Accepts `customerId` and `token` (a secure token for validation)
- Validates the token against a new `card_update_links` table
- Creates a Stripe SetupIntent for the existing customer
- Returns the clientSecret

**3. New edge function: `supabase/functions/complete-card-update/index.ts`**
- Accepts `setupIntentId`, `customerId`, and `token`
- Retrieves the SetupIntent, attaches the new payment method as default on the customer
- Updates the `lesson_proposal_payment_methods` table with new card details
- Marks the update link as used

**4. New DB table: `card_update_links`**
- Columns: `id`, `customer_id` (Stripe customer ID), `token` (UUID), `email`, `name`, `used` (boolean), `expires_at`, `created_at`
- RLS: public read access filtered by token (no auth required since this is a public link)

**5. Route added to `src/App.tsx`**
- `<Route path="/update-card/:customerId/:token" element={<UpdateCardDetails />} />`

### Technical details

- Reuses same `loadStripe` key, `Elements`, and `PaymentElement` pattern from `PaymentCaptureStep`
- The form component is nearly identical — same fields (Cardholder Name, Email, Card Details via PaymentElement)
- Edge functions use `STRIPE_SECRET_KEY_LESSON_PROPOSAL` same as existing proposal functions
- Token-based access means no Supabase auth required — customers click a link from email

