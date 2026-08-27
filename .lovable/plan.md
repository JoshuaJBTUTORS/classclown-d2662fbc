# Account Settings redesign: full width, accordions, Cleo avatars

## What changes

1. **Header** — replace the lilac pastel pill band with a plain header on the page background: Caveat "your account" accent, large heading, subtitle, thin bottom hairline. No coloured block, no scribble fill (keep a faint neutral scribble only if it reads as ink, otherwise drop it).

2. **Full-width layout with dropdown sections** — remove the `max-w-4xl` cap so the page uses the full content width. Replace the pill tab bar with stacked collapsible accordion sections that each span the full width:
   - Profile Icon
   - Profile
   - Security
   - Account Information
   - System (admins/owners only)
   Each section header is a rounded row with a soft pastel icon chip, title, short description, and a chevron. Profile Icon and Profile open by default.

3. **Profile Icon section** — shows the current icon large, with a picker:
   - Default option: initials (first + last name) on a pastel circle — this is what shows when nothing is chosen.
   - Four Cleo/Cleon avatar illustrations to choose from.
   Clicking an option saves it immediately and toasts. The chosen icon is used by the sidebar profile pill (and anywhere else the user avatar renders).

## Technical notes

- Avatars: four generated illustrations of Cleo/Cleon (the mascot) in different variants, saved to `src/assets/avatars/` and imported as ES6 image imports. A small registry module `src/lib/cleoAvatars.ts` maps keys (`cleo-1`…`cleo-4`) to imports so the sidebar and settings resolve the same source.
- Persistence uses the existing `profiles.avatar_url` column — no migration needed. We store the avatar key (e.g. `cleo-2`) or `null` for initials, and resolve via the registry (a full URL still renders directly if present).
- `AuthContext` gets a small `refreshProfile()` call after save so the sidebar updates without a reload (reuse the existing profile fetch).
- New components: `src/components/settings/ProfileIconSettings.tsx`, plus a reusable `src/components/settings/SettingsSection.tsx` accordion wrapper built on the existing shadcn `Accordion`.
- `SidebarProfile.tsx` updated to render the chosen avatar image, falling back to initials.
- `ProfileSettings.tsx` / `SecuritySettings.tsx` keep all existing form logic; only their outer card chrome is dropped since the accordion provides it. Inputs stay pill-shaped, submit stays a dark pill.
