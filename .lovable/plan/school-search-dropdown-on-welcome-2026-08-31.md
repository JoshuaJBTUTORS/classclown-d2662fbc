# School search dropdown on /welcome

Replace the free-text "School" input on the welcome onboarding with a searchable dropdown backed by the official UK schools list you uploaded (GIAS extract, 55,336 rows; 25,440 open schools once closed/proposed entries and children's centres are excluded).

## Behaviour

- The details step shows a "Search for your school" control per child.
- Typing 2+ characters searches by school name, town and postcode and shows up to 20 matches, each as: school name, then town + postcode underneath.
- Selecting a match fills the field; the stored value stays the school name (so existing admin/tutor views are unchanged), and the school's official reference (URN) is stored alongside it.
- A school must be selected to continue — typed text that matches nothing will not satisfy the required check.
- If a family genuinely cannot find their school, the list includes a final "My school isn't listed" option that lets them type the name manually, so nobody is blocked.
- Search results load from the database as they type (debounced), so the app bundle stays small.

## Data

New reference table `public.uk_schools` populated from the uploaded CSV, open establishments only:

- `urn` (primary key), `name`, `town`, `postcode`, `local_authority`, `phase`, `establishment_type`
- Readable by everyone signed in and by anonymous visitors (it is public reference data); no one can write to it from the app.

`public.students` gains `school_urn text` (nullable) so the selected school is traceable; the existing `school` text column keeps the display name.

## Technical notes

- Migration: create `uk_schools` with grants to `anon`, `authenticated`, `service_role`, enable RLS with a read-only policy; add `pg_trgm` GIN indexes on `name` and `town` plus a plain index on `postcode`; add `students.school_urn`.
- Import: filtered CSV (open, excluding Children's Centres) loaded via `COPY` from the sandbox — around 25k rows.
- New `src/components/welcome/SchoolCombobox.tsx` using the existing shadcn `Command` + `Popover` pattern, styled with the ClassClown tokens already used on the page (rounded surfaces, black outline, pastel focus) — no hardcoded colours.
- Query via the Supabase client: `.or(name.ilike.%q%,town.ilike.%q%,postcode.ilike.q%)` limited to 20, debounced with the existing `useDebouncedValue` hook.
- `WelcomeOnboarding.tsx`: swap the school `Input` for the combobox, keep `school` in state, add `school_urn`, and include it in the save payload; validation unchanged apart from requiring a selection.
