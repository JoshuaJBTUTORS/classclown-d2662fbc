# Redesign the /students "Add New" modals to the ClassClown design language

## Scope
Restyle the six dialogs opened from the **Add New** dropdown on `/students`. **Visual-only** — no changes to form fields, validation, submission handlers, edge-function calls, dropdown wiring, or any behavior.

Dialogs in scope:
| Dropdown item | Component |
|---|---|
| Add Family | `src/components/students/AddParentStudentForm.tsx` (515 lines) |
| Add to Parent | `src/components/students/AddStudentToParentForm.tsx` (349) |
| Link Existing Student | `src/components/students/LinkStudentToParentForm.tsx` (357) |
| Add Client Only | `src/components/students/AddStudentForm.tsx` (364) |
| Add Parent Only | `src/components/parents/AddParentOnlyForm.tsx` |
| Bulk Import | `src/components/students/BulkImportDialog.tsx` (295) + `BulkImportPreview.tsx` (152) |

## Design language (from the uploaded PDF)
- Fonts: Plus Jakarta Sans headings (`font-heading`), Inter body.
- Shape: `--radius-soft` (1.5rem) on dialog surfaces, pill-shaped inputs/buttons (`rounded-full`), no sharp edges.
- Depth: `--shadow-soft` only — no borders on pastel surfaces; black outline reserved for outlined chip buttons.
- Pastel surfaces: mint / lilac / butter / blush / sky / sand with matching foreground tokens.
- No harsh colors, no LLM-looking icons — reuse existing doodle SVGs (`ProgressDoodles`, `DoodleIcons`) or plain lucide icons inside circular bordered chips.

## Per-dialog treatment (same recipe everywhere)
1. **Dialog shell** — `DialogContent` gets `rounded-[var(--radius-soft)]`, `border-0`, `shadow-[var(--shadow-soft-lg)]`, generous padding (`p-6 sm:p-8`).
2. **Header** — `font-heading text-2xl font-extrabold tracking-tight` title, small circular outlined icon chip beside it (matching the students-page button pattern), muted description text.
3. **Inputs & selects** — full-pill or `--radius` rounded fields (`rounded-full h-11` for text inputs), `bg-muted`/`bg-card` fills with no harsh borders; consistent label styling (`text-sm font-medium`).
4. **Buttons** —
   - Primary submit: solid black pill (`bg-foreground text-background rounded-full h-11 px-6`, hover lift).
   - Cancel/secondary: transparent black-outline chip identical to the new Cleo Onboarding / Request topic buttons.
   - Destructive (if any): keep destructive semantics but in the same pill shape.
5. **Inner panels** (subject pickers, file dropzones, import preview table, info notices) — pastel surfaces (`bg-pastel-sand`/`bg-pastel-sky` etc. with matching foreground tokens), `rounded-[var(--radius-soft)]`, no borders.
6. **BulkImportDialog/Preview** — same shell/header/buttons; preview table gets rounded container, soft header row, pastel status badges (success mint, error blush).
7. Consistent `animate-fade-in` entrance and `focus-visible` ring on all interactive elements.

## Explicitly unchanged
- All form schemas, zod validation, required fields, default values.
- All `supabase` calls, edge-function invocations, CSV parsing, and `onSuccess`/`onClose` flows.
- Dialog open/close state wiring in `Students.tsx`.

## Verification
- Typecheck/build passes.
- Each of the six dialogs opens from the dropdown, renders the new styling, and submits/cancels exactly as before.
