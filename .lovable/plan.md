# Sidebar polish: brand block, logo, softer group headers

Visual-only changes to `src/components/navigation/Sidebar.tsx`. No navigation, roles, or behaviour changes.

## 1. Brand block — remove the green pill

Drop the filled mint panel behind "ClassClown". Instead:

- Plain transparent header on the sidebar background.
- Logo sits at its natural size (no coloured chip behind it), name in heading font, "Live Tutoring Account" in muted small text underneath.
- Keep a very faint scribble motif behind it at ~6% opacity so it still feels branded, or drop it entirely if it reads as noise.
- Separation from the nav comes from whitespace, not a box.

## 2. Logo

Use the uploaded waving-hand + green "Class" mark as the sidebar logo, registered through the asset pipeline (no binary committed into the repo). Two layout options:

- **A (recommended):** the wordmark image on its own across the top (it already contains "Class"), with "Live Tutoring Account" beneath — no separate text "ClassClown".
- **B:** crop-free full mark plus the existing "ClassClown / Live Tutoring Account" text stack.

I will go with A unless you say otherwise.

## 3. Softening the harsh menu-bar lines — options

Currently each group header is a full-width filled pill and groups are split by dashed rules. Ideas:

- **Option 1 — Quiet labels (recommended):** group titles become small uppercase muted text with no background at all, plus a chevron. Colour only shows on the active item pill. Result: a calm, airy list, no banding.
- **Option 2 — Tinted zone:** the whole expanded group sits inside one very light (≈8% tint) rounded container; the header text is coloured but has no pill. Groups read as soft zones rather than stacked bars.
- **Option 3 — Accent dot:** no background on the header; a small pastel dot in the group's tone sits before the label, and the active item keeps the filled pill.

In all options: remove the dashed dividers and use spacing (roughly 20px between groups) instead, and soften the active pill's shadow.

## Technical notes

- Only `src/components/navigation/Sidebar.tsx` is edited, plus one asset pointer JSON in `src/assets/` for the logo.
- `GROUP_TONES` is kept and reused for the active state / dots depending on the chosen option.
- All colours stay semantic pastel tokens; no hardcoded hex.
