# Mobile-optimize the Edit Tutor dialog

Target: `src/components/tutors/EditTutorForm.tsx`. On a 392px phone viewport the dialog is cut off — it overflows the screen height, actions are hard to reach, and padding is desktop-sized.

## Changes (visual/layout only — no form logic touched)

1. **Fit the viewport on mobile**
   - Dialog width: `w-[calc(100vw-1.5rem)]` on mobile, keep `sm:max-w-[600px]` on desktop.
   - Height: use `max-h-[92dvh]` (dynamic viewport height, so mobile browser chrome doesn't clip the bottom) instead of `90vh`.

2. **Sticky action footer**
   - Restructure `DialogContent` as a flex column: the form body becomes the scrollable region (`flex-1 overflow-y-auto`), and the Cancel / Update Tutor footer becomes a sticky bottom bar (`sticky bottom-0` with the card background and a subtle top border/shadow) so the buttons are always reachable without scrolling to the very bottom.

3. **Mobile-sized spacing and type**
   - Padding `p-4` on mobile (keep `sm:p-8`), tighter `space-y-3` gaps, header title `text-xl` on mobile (`sm:text-2xl`), smaller icon circle.
   - Form grids already collapse to one column — keep as is.

4. **Subjects chips**
   - Give the selected-subjects chip area a `max-h-28 overflow-y-auto` so long subject lists don't push the whole form down on a phone.

5. Sanity-check the Availability section and rate fields stack cleanly at 392px (they use the shared single-column editor, no changes expected unless inspection shows overflow).

The same cut-off issue exists in the Add Tutor dialog (`AddTutorForm.tsx`), which uses the identical shell — I'll apply the same mobile shell fix there too so both stay consistent. No fields, validation, handlers, or submit logic change in either file.

## Verification
- `tsgo` typecheck + build log.
- Visual check at a phone viewport (you can use the device button above the preview): dialog fits within the screen, scrolls internally, and Update/Cancel stay visible.
