

## Update Card Details Page — Simple, Open, Proposal-Style

Rewrite the existing `/update-card` page and its edge functions to work exactly like the proposal payment step (step 2), but standalone — no proposal needed, no tokens, no lookups.

### What changes

**1. Rewrite `src/pages/UpdateCardDetails.tsx`**
- Remove `useParams`, token logic, and link-expired state
- Two-step flow on one page:
  - User enters name + email, clicks "Continue"
  - Edge function creates a Stripe customer + SetupIntent (same as `create-proposal-setup-intent`)
  - Stripe PaymentElement renders with the clientSecret
  - On submit, calls `complete-card-update` to save the card
- Copy: "Update Card" heading, "As part of our routine annual payment method check..." subtext, "Update Card Details" button
- Success screen: "Card Updated!" with checkmark

**2. Rewrite `supabase/functions/create-card-update-setup-intent/index.ts`**
- Accept `{ email, name }` only
- Create a new Stripe customer with that email/name (same as proposal flow — get or create)
- Create a SetupIntent for that customer
- Return `{ clientSecret, customerId }`
- No token validation, no `card_update_links` table usage

**3. Rewrite `supabase/functions/complete-card-update/index.ts`**
- Accept `{ setupIntentId, customerId }`
- Retrieve SetupIntent, get payment method details
- Set as default payment method on the customer
- Save record to `card_update_submissions` table (name, email, stripe IDs, card details, timestamp)
- No proposal updates, no notification emails

**4. New DB table: `card_update_submissions`**
- `id` (uuid), `stripe_customer_id`, `stripe_payment_method_id`, `stripe_setup_intent_id`, `card_last4`, `card_brand`, `card_exp_month`, `card_exp_year`, `billing_name`, `billing_email`, `created_at`
- No RLS needed (only written by edge function via service role)

**5. Route in `src/App.tsx`**
- Keep `/update-card` (no params)

