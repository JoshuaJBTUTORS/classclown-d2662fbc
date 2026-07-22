## Goal

Assign every ticket created by `hubspot-create-payment-ticket` to Britney using her HubSpot owner ID `69644926` directly — no Owners API lookup needed.

## Change

**`supabase/functions/hubspot-create-payment-ticket/index.ts`**

In the ticket create call (around lines 115–122), add `hubspot_owner_id: '69644926'` to `properties`:

```ts
properties: {
  subject: `Payment Setup — ${parentName}`,
  content,
  hs_pipeline: '0',
  hs_pipeline_stage: '1',
  hs_ticket_priority: 'HIGH',
  hubspot_owner_id: '69644926',
},
```

Then redeploy the function.

## Verification

Run onboarding for a test proposal → click "I have added lessons" → confirm the new HubSpot ticket's Owner is Britney.

## Out of scope

- Existing tickets already created stay on their current owner.
- Owner ID is hard-coded; if you later want it configurable per environment we can move it to a secret.
