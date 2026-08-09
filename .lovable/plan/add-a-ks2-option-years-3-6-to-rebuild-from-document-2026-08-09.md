# Add a KS2 option (Years 3-6) to Rebuild from document

The key stage selector in the Rebuild dialog currently offers KS3 (Years 7-9), GCSE (Years 10-11) and the whole document. Add KS2 covering Years 3, 4, 5 and 6, and have it auto-select for KS2-style subjects.

## What changes

- New dropdown option: "KS2 — Years 3, 4, 5 and 6".
- Subject auto-detection: subjects containing KS2, "Early KS2", "Sats" or "11 Plus" default to KS2 instead of KS3. KS3 subjects keep defaulting to KS3; GCSE/Year 10/11 keep defaulting to GCSE.
- The document slicer accepts `ks2` and keeps only the "Year 3/4/5/6 units" sections before sending to the AI.
- Everything else is unchanged: 52-week cycle, assessment weeks 9/22/35/48, removal of weeks without a learning outcome, and rewording of anything that can't run online.

## Technical notes

- `supabase/functions/rebuild-lesson-plan-from-pdf/index.ts`
  - `KEY_STAGE_YEARS`: add `ks2: [3, 4, 5, 6]`.
  - Allow-list on the incoming `keyStage` becomes `["ks2", "ks3", "gcse", "all"]`.
- `src/components/lessonPlans/RebuildPlanFromPdfDialog.tsx`
  - `KeyStage` type gains `'ks2'`; add the select item.
  - `detectKeyStage`: check GCSE first, then `ks2`/`sats`/`11 plus` → ks2, then `ks3` → ks3, else all.
- No database or schema changes.
