# Redesign Trial Bookings

## Scope

Redesign the existing `/trial-bookings` admin page to match the uploaded ClassClown design language. This is a visual-only update: no booking, approval, rejection, resend, Review Room, routing, permission, or data behaviour will be changed.

## Design direction

Apply the shared ClassClown visual system already used across Students, Tutors, Time Off, and Lesson Summaries:

- Plus Jakarta Sans headings and Inter body text.
- Soft pastel surfaces using the existing semantic palette: mint, lilac, butter, blush, sky, and sand.
- Large rounded cards with `1.5rem` radii and soft shadows.
- Rounded pill filters, tabs, status chips, and action buttons.
- Hand-drawn doodle icons where appropriate, avoiding generic AI-looking icon styling.
- Subtle hover lift and fade transitions, without changing click targets or workflow order.

## Page updates

1. Rebuild the page header as a full-width ClassClown header with a large "Trial Bookings" title, result-count pill, and Export action.
2. Replace the current boxed table treatment with a soft card surface and responsive booking rows similar to the redesigned Students and Tutors lists.
3. Restyle the All, Trial Lessons, and Review Room tabs, including the Review Room day filters.
4. Redesign search, status filter, and referral filter as rounded outlined controls.
5. Use consistent pastel status chips:
   - Pending: butter
   - Approved: mint
   - Rejected: blush
   - Completed: sky
6. Keep Review Room grouping, session badges, aggregate status logic, and pending/approved counts exactly as they are, but present them in the new visual style.
7. Restyle row actions for view, resend confirmation, approve, and reject while preserving the same buttons, conditions, titles, and handlers.
8. Redesign loading and empty states with pastel panels and existing doodle empty-state artwork.
9. Ensure the page uses the available desktop width correctly and collapses cleanly on mobile.

## Dialog updates

Redesign only the appearance of the dialogs reached from this page:

- Trial Booking Details dialog
- Approve Trial Booking dialog
- Review Room bulk approval dialog

Use rounded dialog shells, pastel detail panels, doodle-style status visuals, outlined secondary buttons, and black pill primary actions. All form fields, validation, disabled states, approval checks, service calls, notifications, and success/error behaviour remain unchanged.

## Files expected to change

- `src/pages/TrialBookings.tsx`
- `src/components/trialBooking/TrialBookingApprovalDialogWithAdmin.tsx`
- `src/components/trialBooking/ReviewRoomApprovalDialog.tsx`

The older `TrialBookingApprovalDialog.tsx` appears unused by this page, so it will be left alone unless inspection during implementation proves it is still reachable.

## Verification

- Run TypeScript/build checks.
- Review the compiled page for layout errors.
- Confirm all existing actions and dialog workflows are still wired to the same handlers.
- Check the build log for a clean result before completion.
