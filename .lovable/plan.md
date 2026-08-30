# Proposal builder: drag-and-drop lesson times + price input fix

Scope: `src/components/proposals/ProposalForm.tsx` only (shared by `/admin/proposals/create` and the edit view). Visual/input behaviour only — no schema, validation, submit, or pricing-logic changes.

## 1. Drag and drop lesson times

Reuse the same native HTML5 pattern already used in the tutor availability editor (`src/components/tutors/AvailabilityScheduleEditor.tsx`):

- Each lesson time row gets a grab handle (grip icon) on the left, `draggable` on the row wrapper.
- `onDragStart` stores the row index, `onDragOver` previews, `onDrop` reorders the `lessonTimes` array and calls `form.setValue('lessonTimes', next)` exactly as the existing add/remove handlers do.
- Dragged row shows the same reduced-opacity / highlighted drop target styling as the availability editor.
- Rows switch from index keys to stable per-row ids so reordering doesn't scramble focus.
- Order is purely presentational for the proposal; the reordered array is what gets submitted, same as today.

## 2. Price field leading zero

Today the price input is bound to a number and any empty/partial entry is coerced to `0`, so the field shows a stuck `0` in front of what is typed.

Fix: keep the raw text the user typed in local component state per row for the price field, and only parse to a number when writing into `lessonTimes`. Empty input shows an empty field (still stored as `0` behind the scenes so validation and totals are unchanged). Same treatment applied to duration so it behaves consistently.

## Verification

Typecheck and build, then open `/admin/proposals/create` and confirm rows reorder by dragging and that typing a price like `35` shows `35`, not `035`.
