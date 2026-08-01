## Goal

When a client is onboarded (Step 3, "I have added the lessons"), find their contact in HubSpot by email or phone and set `hs_lead_status` to **Active Customer**.

## Approach

Extend the existing `hubspot-create-payment-ticket` edge function, which already runs at exactly that moment and already searches HubSpot for the contact by email. No new function or new frontend call needed.

### Contact lookup (improved)
Current behaviour: search by email only, create the contact if not found.

New behaviour:
1. Search by `email` (exact match).
2. If nothing found and a phone number exists, search again by `phone` — and also by `mobilephone` — using a normalised number (strip spaces/dashes, try both `07...` and `+447...` forms) so UK-formatted numbers match.
3. If still nothing found, create the contact as today.

### Status update
After the contact is resolved, PATCH the contact with:
```
hs_lead_status = "Active Customer"
```
This runs before the ticket creation and is independent of it: if the status update fails (for example because "Active Customer" is not a configured option on the property in this HubSpot portal), log the HubSpot status and body, show a warning toast, and still create the payment setup ticket. Onboarding is never blocked.

The function response gains `contactId`, `leadStatusUpdated: true|false`, and `leadStatusError` so the UI can report accurately.

### Onboarding UI
In `src/pages/Onboarding.tsx`, after the ticket call returns, surface the outcome:
- success: "Payment ticket created and HubSpot contact marked Active Customer"
- partial: existing success toast plus a warning "Could not update HubSpot lead status — update manually"

## Note on the property value

`hs_lead_status` is a dropdown. "Active Customer" must exist as an option in your HubSpot portal, and HubSpot expects the option's *internal value*, which is often uppercase/underscored (e.g. `ACTIVE_CUSTOMER`). The function will read the property's option list once via the HubSpot properties API and match "Active Customer" case-insensitively by label to get the correct internal value, so it works regardless of how the option was named internally. If no matching option exists, it logs a clear error rather than silently failing.

## Technical details

- `supabase/functions/hubspot-create-payment-ticket/index.ts`: add `findContactByPhone`, `resolveLeadStatusValue` (properties API lookup, cached per invocation), and `setLeadStatus`; wire them into the existing flow; extend the JSON response.
- `src/pages/Onboarding.tsx`: read the new response fields in `handleAddedLessons` and adjust toasts.
- No database changes.
