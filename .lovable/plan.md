
Update the current card-update flow to match the proposal payment flow as closely as possible, but as one open public page.

1. Replace the route
- Change `/update-card/:customerId/:token` to a single public route: `/update-card`.

2. Rebuild the page to mirror the proposal payment UI
- Use the same structure and Stripe Elements flow as `PaymentCaptureStep`.
- Keep the same styling/layout.
- Change the heading from “Almost There!” to “Update Card”.
- Change the subtext to: “As part of our routine annual payment method check, please update your payment details using the secure link below.”
- Keep name + email inputs on the page.
- Keep the Stripe `PaymentElement`.
- Change the button text to “Update Card Details”.
- Remove the token/link-expired logic and remove the current param-based setup.

3. Change the setup-intent function to stop validating links
- Refactor `create-card-update-setup-intent` so it accepts only `name` and `email`.
- Do not look up any existing customer.
- Do not use `card_update_links`.
- Create a brand new Stripe customer directly from the submitted name/email.
- Create a SetupIntent for that customer and return the `clientSecret` (same pattern as proposal flow).

4. Change the completion function to match the new flow
- Refactor `complete-card-update` so it accepts the new `setupIntentId` and the created `customerId`.
- Remove all token validation.
- Retrieve the Stripe payment method from the SetupIntent.
- Set it as the default payment method for that Stripe customer.
- Save the result in a simple database record for tracking.

5. Simplify the database side
- Stop using the `card_update_links` table entirely.
- Add a small dedicated table for public card update submissions if needed, since `lesson_proposal_payment_methods` requires a `proposal_id` and cannot cleanly store these standalone updates.
- Store basics like name, email, stripe customer id, payment method id, card brand/last4, and timestamps.

6. Keep the success state simple
- After successful confirmation, show the existing “Card Updated!” success screen.

Technical details
- This will be fully public: no auth, no token, no customer lookup.
- It will follow the proposal-style logic: collect name/email, create a Stripe customer, create a SetupIntent, confirm the card, then save the result.
- Important consequence: this does not “find and update” an existing Stripe customer; it creates a fresh Stripe customer/payment profile each time, exactly as requested.
