# Fix the Lesson Plans search bar

## What's wrong

On `/lesson-plans` the search box updates state and a filtered list is computed, but the page never uses it. The subject cards on screen are always built from the full, unfiltered list of lesson plans, so typing changes nothing.

## What to change

In `src/pages/LessonPlans.tsx`:

- Build the subject cards from the filtered results instead of the full list, so typing narrows the visible subjects.
- Matching stays on subject name, topic title, and term (case-insensitive), so searching a topic surfaces the subject that contains it.
- Card counts (plans, terms, weeks) reflect the matching plans while a search is active, and revert to full counts when the box is cleared.
- Show the existing "no results" empty state with a Clear search action when a search matches nothing, instead of the current blank grid.
- Hero stat tiles keep showing overall totals.

## Technical notes

- Replace the `filteredPlans` state plus `filterPlans` effect with a `useMemo` derived value, and derive `subjects` / `subjectStats` from it.
- Subject detail dialog behaviour is unchanged.
