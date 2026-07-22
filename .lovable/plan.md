# Step 4: HubSpot Payment Setup Ticket

Trigger a HubSpot ticket when the user clicks **"I have added lessons"** on Step 3 of `/onboarding`, then advance to a new Step 4 confirmation screen.

## New edge function: `hubspot-create-payment-ticket`

- Auth: uses existing `HUBSPOT_API_KEY` secret (same pattern as `hubspot-trial-integration`).
- Input: `{ proposalId, parentEmail, parentName, parentPhone }`.
- Logic:
  1. Load proposal from DB (subject, lesson_type, contract_term, sessions_per_week, etc.).
  2. Find-or-create HubSpot contact by email (reuse pattern from `hubspot-trial-integration`).
  3. `POST /crm/v3/objects/tickets` with:
     - `subject`: `Payment Setup — <Parent Name>`
     - `content`: parent name/email/phone + subject, lesson type, contract term, sessions/week
     - `hs_pipeline`: `"0"`, `hs_pipeline_stage`: `"1"`
     - `hs_ticket_priority`: `"HIGH"`
     - `associations`: contact via `associationTypeId: 16`
  4. Return `{ ticketId, contactId }`; log failures but don't block UI.
- CORS headers on all responses.

## Frontend: `src/pages/Onboarding.tsx`

- On "I have added lessons" click:
  - Call `supabase.functions.invoke('hubspot-create-payment-ticket', { body: {...} })`.
  - Show toast on success/failure (failure is non-blocking — still advance).
  - Advance to new **Step 4**.
- New Step 4 UI: confirmation card ("Payment setup ticket created in HubSpot") with a **Finish** button that routes to `/students`.
- Update stepper to show 4 steps.

## Out of scope

- No pipeline/stage secrets (hardcoded 0/1 per your choice).
- No changes to existing trial HubSpot integration.
