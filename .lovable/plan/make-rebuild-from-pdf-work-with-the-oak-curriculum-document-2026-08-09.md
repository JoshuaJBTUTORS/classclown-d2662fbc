# Make "Rebuild from PDF" work with the Oak curriculum document

## Will the uploaded document work?

Not as it stands. The Oak "KS3 & KS4 Maths curriculum plan (Higher)" is a good source of truth, but three things don't line up with the current feature:

1. **It's a .docx, not a PDF.** The rebuild function only accepts PDF uploads today.
2. **It covers five year groups in one file** (Year 7, 8, 9, 10 and 11 as separate unit sequences). If the whole file is sent when rebuilding "KS3 maths", the AI also sees the GCSE years and can pull Year 10/11 content into a KS3 plan.
3. **It's organised by units, not weeks.** Year 7–9 is 32 units; Year 10–11 is 36 units. Your plans are single 52-week cycles, so the AI needs an explicit rule for spreading units across weeks.

Everything else fits: each unit already has a title, a description, a "why this, why now" rationale and a numbered lesson list, which is exactly the detail needed to write a weekly topic and description.

## What will change

**Accept Word documents as well as PDFs.** The dialog will take `.docx` and `.pdf`. Word files are unzipped and converted to plain text before being sent to the AI; PDFs are attached as-is.

**Split the document by key stage before sending it.** Based on the subject being rebuilt, only the relevant year sections are extracted:

- KS3 subjects → Year 7, 8 and 9 sections only
- GCSE / Year 10–11 subjects → Year 10 and 11 sections only
- Anything else → the whole document

The dialog will show which sections were detected (e.g. "Using Year 7, 8, 9 — 32 units") so it's obvious before you run it. If detection fails, you can override the key stage with a dropdown.

**Teach the AI how to turn units into weeks.** Added to the instructions:

- All units for the selected years are compressed into the single 52-week cycle in unit order, roughly 1–2 weeks per unit depending on how many lessons it contains.
- The unit's lesson list drives the week description; the unit title drives the week topic.
- Larger units (10+ lessons) may take two consecutive weeks; short units may be paired into one week.
- Term labels stay attached to the existing week numbers.

**Unchanged rules** (as confirmed): weeks 9, 22, 35 and 48 are always overwritten as assessment weeks; weeks without a clear learning outcome are removed; anything untaught online is reworded; and weeks the AI doesn't return are still deleted.

## Technical notes

- `supabase/functions/rebuild-lesson-plan-from-pdf/index.ts`
  - Accept `fileBase64` + `mimeType` (keeping `pdfBase64` working for existing calls).
  - For `.docx`: unzip with JSZip via `esm.sh`, read `word/document.xml`, convert `<w:p>` to newlines and `<w:t>` to text, decode entities → plain text sent as an `input_text` block.
  - Add a `keyStage` input (`ks3` | `gcse` | `all`). When set, slice the extracted text between the "Year N units" headings for that key stage before sending.
  - Extend the system instructions with the unit-to-week compression rules above.
  - Return the detected year sections and unit count in the response so the UI can show them.
- `src/components/lessonPlans/RebuildPlanFromPdfDialog.tsx`
  - Accept `application/pdf` and the Word MIME type; keep the 15MB cap.
  - Derive the default key stage from the subject name (`KS3`/`KS2` → ks3, `GCSE`/`Year 10`/`Year 11` → gcse) and expose a small dropdown to change it.
  - Pass `fileBase64`, `mimeType` and `keyStage` to the function; show the detected sections in the results panel alongside the change list.
- No database or schema changes.
