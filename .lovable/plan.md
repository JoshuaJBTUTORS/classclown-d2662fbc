# Send trial attendance to HubSpot

When a trial lesson's student is marked attended or absent, update that contact's lead status in HubSpot.

## Behaviour

- Marked **Attended** -> lead status set to "Trial Lesson Complete"
- Marked **Absent** -> lead status set to "No Show" (internal value `UNQUALIFIED`)
- Other statuses (late, excused, scheduled) change nothing in HubSpot
- Only trial/demo lessons trigger this; regular lessons are ignored
- If HubSpot fails, the attendance mark still saves — the failure is logged only

## How it works

1. New edge function `hubspot-trial-attendance`:
   - Receives the lesson id, student id and new attendance status.
   - Looks up the lesson server side; exits quietly unless `lesson_type` is trial or demo.
   - Pulls the contact details from the linked `trial_bookings` row (email, parent name, phone); falls back to the parent record on the student if no trial booking is linked.
   - Finds the HubSpot contact by email, then phone variants, the same way `hubspot-create-payment-ticket` does.
   - Resolves the correct `hs_lead_status` option: `UNQUALIFIED` for absent, and the option labelled "Trial Lesson Complete" for attended (matched by label, same lookup pattern as the existing function, so a label rename in HubSpot is handled). If no matching option exists, it logs the available options and returns a clear error.
   - PATCHes the contact with the resolved value and returns the HubSpot status/body on failure.
2. `src/hooks/useAttendanceManager.ts` calls this function after a successful attendance upsert, fire and forget, only for `attended` and `absent`.

## Technical notes

- Reuses the existing `HUBSPOT_API_KEY` secret and the direct HubSpot v3 API pattern already in `hubspot-create-payment-ticket` / `hubspot-trial-integration`.
- Service-role client inside the function so lesson and booking lookups are not blocked by row level security.
- No database changes.
