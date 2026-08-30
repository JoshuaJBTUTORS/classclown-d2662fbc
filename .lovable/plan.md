# Send onboarding details to HubSpot

When a parent or student finishes the mandatory `/welcome` onboarding, push the collected details to the existing HubSpot CRM account (same portal already used for trial bookings and payment tickets).

## What gets sent

For the signed in parent/student:
- Email, first name, last name, phone (from their profile)
- For each linked child: child name, school, year group

Behaviour in HubSpot:
- Look up the contact by email. If it exists, update it; if not, create it.
- Update contact properties with the school and year group of the first/primary child.
- Attach a note to the contact summarising onboarding completion and every child's name, school and year group, plus the completion timestamp.

## How it works

1. New edge function `hubspot-onboarding-sync`:
   - Validates the caller's JWT and loads their profile plus linked children server side (service role), so the client cannot spoof data.
   - Uses the existing `HUBSPOT_API_KEY` secret and the same direct HubSpot API pattern as `hubspot-trial-integration` (contact search -> create/update -> associated note).
   - Returns the provider status and body on failure so errors are visible in logs.
2. `WelcomeOnboarding.tsx` `finish()` calls the function after the profile is marked complete, fire and forget: a HubSpot failure is logged but never blocks the user from entering the app.

## Notes

- Only standard HubSpot contact properties are assumed (`email`, `firstname`, `lastname`, `phone`). School and year group will be written into the note body, and also into custom properties `school` / `year_group` only if you confirm those exist in your portal; otherwise the note carries them.
