# /tutors — ClassClown redesign + Active/Inactive tabs

Visual-only redesign of `src/pages/Tutors.tsx` to the ClassClown design language, plus splitting tutors into two tabs based on whether they have subjects assigned.

## Rules (unchanged behavior)
- No UX/workflow changes: same dialogs (Add, View, Edit, Delete, Send Offer), same buttons, same handlers, same data fetching (`tutors` + `tutor_subjects`), same ordering (newest first), same pagination logic (50/page), same header actions ("Tutor Onboarding", "Add Tutor").
- Tab classification is computed from data already loaded: a tutor whose `subjects` array is empty (currently displayed as "N/A") goes to the **Inactive** tab; tutors with at least one subject stay in the **Active** tab. No database changes.

## Changes

### `src/pages/Tutors.tsx` (visual redesign only)
1. **Tabs** — "Active" (tutors with subjects) and "Inactive" (tutors with no subjects / N/A) as black-outline pill chips in the ClassClown style, each showing a count badge. Pagination and the "Showing X of Y" count apply to the selected tab; switching tabs resets to page 1.
2. **Header** — Plus Jakarta Sans large heading with a count pill, matching `/students-list`; "Tutor Onboarding" becomes a black-outline pill with a doodle mail icon; "Add Tutor" becomes a solid black rounded-full pill.
3. **List** — replace the bordered table with a soft pastel card surface containing responsive tutor rows: initials avatar in a pastel chip, name, email, subjects as small pastel pills (or a muted "N/A" chip on the Inactive tab), and the same four action controls (Send Offer, Delete, Edit, View) restyled as round black-outline icon buttons with doodle-style icons; View stays a small black pill.
4. **States** — pastel rounded loading, empty, and no-tutors-in-tab states with a doodle icon.
5. **Pagination** — restyle page pills to rounded black-outline chips with active = black fill; logic untouched.

### Unchanged
- `AddTutorForm`, `EditTutorForm`, `DeleteTutorDialog`, `ViewTutorProfile`, `SendOfferDialog` internals.
- No new queries, no RLS or role changes, no routing changes.

## Verification
- `tsgo` typecheck and build log check.
- Manual look at `/tutors` in the preview: Active/Inactive counts, N/A tutors only under Inactive, all dialogs still open and work.
