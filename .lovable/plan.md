# Hide Content Creation from tutors, add Key Contacts page

## What changes

1. **Content Creation blocked for tutors**
   - Remove the "Content Creation" (`/tutor-content`) item from the tutor sidebar.
   - Restrict the route so tutors can no longer reach it directly (admins/owners only).

2. **New "Key Contacts" page for tutors** at `/key-contacts`
   - Sidebar entry for tutors, in the same group where Time Off sits, using the ClassClown design language (pastel outlined cards, doodle icons, Plus Jakarta Sans, full-width shell, mobile safe).
   - Ordered list of contacts, escalating first to last:
     1. Hannah Murray — Customer Success Specialist — hannah@classbeyondacademy.io — available Monday to Friday
     2. Britney Lawrence — Head of Growth — britney@classbeyondacademy.io — available Monday to Sunday
     3. Joshua Ekundayo — CEO — joshua@classbeyondacademy.io — available Monday to Sunday
   - Each card shows an initials avatar, name, role chip, availability chip, and a clickable email (mailto) action.
   - Short intro line explaining to contact them in order, starting with the first contact.

## Technical notes

- Contacts are hardcoded in the page component (static reference data, no table needed).
- `src/pages/tutor/KeyContacts.tsx` created; route added in `src/App.tsx` inside `ProtectedRoute` with `allowedRoles={['tutor']}`.
- `src/components/navigation/Sidebar.tsx`: swap the `/tutor-content` tutor item for the new `/key-contacts` item; change the `/tutor-content` route roles to `['admin','owner']`.
- No database, edge function, or other page changes.
