# Redesign /staff

## What changes

1. **Full-width layout** — the page currently wraps content in a fixed narrow column with the sidebar offset applied twice, leaving white space on both sides. Rework it to the same layout shell used by `/students-list` so content spans the full screen width.

2. **ClassClown design language** — replace the plain shadcn cards with the pastel style already used across `/students`, `/tutors`, `/students-list`:
   - Large heading "Staff" with a pastel count pill.
   - One soft rounded card surface holding responsive staff rows.
   - Circular pastel avatars, black-outlined pill controls, doodle icons.
   - Role chips: Owner and Admin as pastel pills instead of the current green badge.
   - Redesigned loading and empty states.

3. **Profile picture from the person's account** — each row shows the avatar the user picked in Settings (`profiles.avatar_url`, resolved through the existing `resolveAvatarSrc` helper), falling back to initials when they haven't chosen one. Today the list only ever renders initials.

4. **Job title instead of "Unknown"** — the secondary line currently tries to show an email fetched with an admin-only API that fails in the browser, so it always says "Unknown". Replace it with the person's job title:
   - Britney Lawrence — Head of Growth
   - Joshua Ekundayo — CEO
   - Hannah Murray — Customer Success Specialist
   - Musa Thulebona — Sales Development Representative
   - Anyone without a title falls back to "Owner" / "Admin" based on their role.

   Titles are stored on the profile so they can be updated later without a code change.

## Technical notes

- Migration: add nullable `job_title text` to `public.profiles`; seed the four titles by matching first/last name; existing grants and RLS on `profiles` already cover reads.
- `src/components/staff/AdminList.tsx`: drop the `supabase.auth.admin.listUsers()` call (it cannot work with the anon key), select `id, first_name, last_name, avatar_url, job_title` from `profiles`, sort alphabetically by first name, and render the new row design.
- `src/pages/Staff.tsx`: switch to the `/students-list` layout shell (`min-h-screen` + `flex` + `flex-1` content, no double sidebar margin) and restyle the "Create Admin Account" section as a ClassClown surface with an outlined pill button.
- No behaviour changes: the Create Admin dialog, its trigger, and role data all stay exactly as they are.
