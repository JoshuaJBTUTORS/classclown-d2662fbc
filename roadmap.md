# Roadmap

## Done
- [x] Assessment "Refresh" button (`refresh-assessment`): no longer deletes student answers. It creates a new paper with new ids and archives the old one, so previous answers, marks and submissions stay with the archived paper.
- [x] Assessment "Refresh" button: names the new version after the current month in London time (e.g. October) instead of always "Summer".
- [x] Confirmation dialog, button tooltip and success message in `src/pages/admin/AssessmentAssignments.tsx` updated to match.

- [x] Assessment Week notice on the calendar: black banner along the top of the page, with the full paragraph revealed by hovering/tapping OR clicking the info "i"; clicking again hides it. Shows 5–11 October 2026 (London), no dismiss button. Verified in browser (click-toggle, hover, pin persistence).

## Notes
- Verified end to end on a throwaway test paper, then removed it.
