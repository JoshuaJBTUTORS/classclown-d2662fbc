# /tutors — layout fix, modal redesign, subject ordering, draggable availability, A–Z list

Visual + ordering changes only. No changes to data model, RLS, dialogs' fields, handlers, or save logic (other than the availability display order noted below).

## 1. Fix the right shift

`src/pages/Tutors.tsx` wraps content in a div with `sidebarOpen && "lg:ml-64"` **and** renders `<Sidebar />` in the same flex row, so the page gets offset twice. Other pages (`StudentsList.tsx`) render `<Sidebar />` inside the flex row with a plain `flex-1` content column and no margin.

Fix: adopt the same structure — drop the `lg:ml-64` margin class, keep `flex-1` for the content column. Everything else in the page layout stays.

## 2. Alphabetical tutor list

Sort loaded tutors by `first_name` (case-insensitive, then `last_name`) instead of newest-first, applied to both Active and Inactive tabs before pagination. Pagination logic unchanged.

## 3. Subjects grouped from A-level downwards

Wherever a tutor's subjects are listed (the row dropdown on `/tutors`, and the profile/edit views), sort them by level in this order: A-level → GCSE / Year 11 → KS3 → KS2 / Sats / Early KS2 → 11 Plus → Other, and alphabetically within each level. Existing per-category pastel colours are kept.

The same ordering is applied to the subject picker (`MultiSelectSubjects` / `SubjectSelector`) so categories appear A-level first.

## 4. Modals redesigned to the ClassClown design language

Restyle these to match the pattern already used for the `/students` dialogs (pastel surfaces, `rounded-[1.25rem]`, black-outline inputs/selects, doodle-ish section chips, black pill primary button, outline pill secondary):

- `AddTutorForm.tsx`
- `EditTutorForm.tsx`
- `ViewTutorProfile.tsx`
- `DeleteTutorDialog.tsx`
- `SendOfferDialog.tsx`
- `MultiSelectSubjects.tsx` / `SubjectSelector.tsx` chips (pastel per category, matching the list page)

Purely presentational: same fields, same validation, same buttons and labels, same submit/delete/offer behaviour.

## 5. Drag-and-drop availability schedule

In the Availability Schedule section of both `AddTutorForm` and `EditTutorForm`:

- Each slot row becomes draggable with a grip handle on the left; rows can be reordered by dragging (native HTML5 drag events — no new dependency).
- Reordering only changes on-screen order and the local slots array, so a tutor can arrange days chronologically; day/start/end values and the existing add/remove/update handlers are untouched.
- Rows also get the redesigned styling (pastel row surface, rounded selects/time inputs, black-outline remove button).

Note: `tutor_availability` has no ordering column, so the chosen order is a UI arrangement within the open dialog and is not persisted between sessions. If you want the order to stick permanently, that needs a new `sort_order` column — say the word and I'll add it.

## Verification

- `tsgo` typecheck + build log.
- Preview `/tutors`: content starts flush with the sidebar, list is A–Z by first name, subject dropdown ordered A-level → 11 Plus, all five modals open and save as before, availability rows drag to reorder.
