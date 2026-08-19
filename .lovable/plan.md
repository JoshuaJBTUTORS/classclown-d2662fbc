# Remove Teaching Materials

Take the teaching materials feature out of the lesson plans area entirely, and clear the existing uploaded materials.

## UI changes

- `src/components/lessonPlans/SubjectDetailDialog.tsx`: remove the "Materials" tab (and its tab trigger), the per-week material count badges, the material count fetching, the weekly materials block, and the upload/list components. Dialog keeps only the Weekly Plans view.
- Delete `MaterialUpload.tsx`, `MaterialList.tsx`, `WeeklyMaterials.tsx` from `src/components/lessonPlans/`.
- Update copy that mentions materials (e.g. "Weekly plans and teaching materials" subtitle).

## Data cleanup

- Delete all rows from `teaching_materials`.
- Delete all objects in the `teaching-materials` storage bucket.
- Keep the table and bucket in place (empty) so nothing else that references them breaks; they can be dropped later if wanted.

## Verification

- Open a subject in Lesson Plans: no Materials tab, no material badges, weekly plans render normally.
- Typecheck passes with the deleted components removed.
