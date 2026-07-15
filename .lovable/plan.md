## Add a new "Students" page under People Management

A new, standalone Students section that just lists students. Separate from the existing Clients page.

### Scope
- Add a sidebar entry **"Students"** in the **People Management** group, under the existing "Clients" item.
- Route: `/students-list` → new page `src/pages/StudentsList.tsx`.
- Visible to roles: `admin`, `owner` (matches other staff-facing entries; can widen later).

### The page
- Standard app shell: `Navbar` + `Sidebar` + `PageTitle` (matches `src/pages/Staff.tsx` layout).
- Loads students via the existing `useStudentData` hook (already queries the `students` table with proper filters).
- Renders a single simple list/table inside one `Card`:
  - Columns: Name (`first_name last_name`), Email, Phone, Year/Grade, Status.
  - Loading state (spinner) and empty state ("No students yet").
- No add/edit/delete, no filters, no pagination — list only, per the request.

### Technical details
- New file: `src/pages/StudentsList.tsx`.
- Edit `src/App.tsx`: import `StudentsList` and add a `ProtectedRoute` for `/students-list` (roles: admin, owner).
- Edit `src/components/navigation/Sidebar.tsx`: add a new item in the People Management group (after "Clients"):
  ```
  { icon: GraduationCap, label: 'Students', href: '/students-list', roles: ['admin','owner'] }
  ```
- Reuse existing shadcn `Table`, `Card`, and the `Student` type from `src/types/student.ts`.
- No DB, RLS, or backend changes — reads existing `students` table via the current hook.

### Out of scope
- No changes to the existing `/students` (Clients) page.
- No CRUD, bulk import, filters, or detail view — those can come in a follow-up.