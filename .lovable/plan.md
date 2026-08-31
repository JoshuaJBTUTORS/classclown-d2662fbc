# Add "Homeschooled" option to the /welcome school picker

## What changes

In the school dropdown on `/welcome`, add a **"Homeschooled"** option alongside the existing "My school isn't listed" fallback.

## How it works

- In `src/components/welcome/SchoolCombobox.tsx`, the popover footer gains a second button: **"We are homeschooled"**.
- Selecting it sets the child's school value to `Homeschooled` with no school URN (`school_urn = null`) and closes the dropdown — the trigger then displays "Homeschooled".
- No new input is shown and no manual typing is required; year group selection stays as-is.
- Existing behaviour is untouched: school search, URN saving, and the "My school isn't listed" manual-entry path all remain.

## Technical notes

- One small component edit; no database changes, no new migrations.
- Downstream code already treats `school` as a free-text string and `school_urn` as nullable, so "Homeschooled" flows through display and reporting without changes.
- Validation in `WelcomeOnboarding.tsx` already passes because the school value is non-empty.

## Verification

- Typecheck/build passes.
- The picker shows the homeschooled option, selecting it fills the field, and saving proceeds as normal.
