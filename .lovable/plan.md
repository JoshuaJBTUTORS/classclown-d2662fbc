# Redesign: Account Settings Page

Redesign `/settings` to match the established ClassClown pastel design language. **Purely visual — no functional changes.** All forms, save logic, validation, and role-based tab visibility stay exactly as they are.

## Design language to apply (same as Sidebar / Calendar / Lesson Plans / School Progress)
- Fonts: Plus Jakarta Sans (headings, bold weight), Inter (body), Caveat for small accent labels
- Pastel surface palette: soft teal/peach/lavender/pink tints on a warm off-white page background
- Large rounded corners (~1.5rem radius) on cards, pill-shaped buttons and inputs
- `ScribbleStroke` hand-drawn SVG underline / tiger-stripe accents on hero sections
- Soft borders (pastel-tinted, not gray) and gentle shadows, no harsh black outlines

## Changes

### 1. `src/pages/Settings.tsx` (page shell)
- Page background: swap `bg-gray-50` for the warm off-white page token used on Calendar/Lesson Plans
- Add a pastel hero band (rounded, ~1.5rem radius, subtle tiger-stripe scribble) with:
  - Caveat accent label ("your account")
  - Plus Jakarta Sans H1 "Account Settings" + Inter subtitle (replaces plain `PageTitle`)
- Restyle the `TabsList`: pastel rounded container (soft tinted background), pill-style active tab in deep teal with white text, inactive tabs as muted text
- "Account Information" card: rounded pastel card with soft tinted border; status values use pill badges (green pastel pill for confirmed, amber pastel for pending)

### 2. `src/components/settings/ProfileSettings.tsx`
- Card: rounded 1.5rem, pastel tinted border, soft shadow
- Card title: Plus Jakarta Sans; description in muted Inter
- Inputs: taller pill-rounded inputs (`rounded-full` / large radius), pastel focus ring in primary teal, icon tint updated to muted pastel
- Labels: small, medium-weight, muted
- "Update Profile" button: pill-shaped, deep teal background (matches "Upload Document Progress" button style from School Progress), loading state unchanged
- Error alert keeps its destructive styling but with rounded corners

### 3. `src/components/settings/SecuritySettings.tsx`
- Same card/input/button treatment as ProfileSettings so both tabs feel identical
- No changes to password/2FA logic

## Not changing
- Save/update logic, Supabase calls, toasts, validation
- Role-gated "System" tab and `AppVersionControl` content
- Any routes or navigation
