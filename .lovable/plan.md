## Build the Onboarding route

Create a dedicated `/onboarding` route that will house all onboarding flows. First section: Parent Only, reusing the existing `AddParentOnlyForm` component and its edge function — no new business logic.

### Files

1. **`src/pages/Onboarding.tsx`** (new)
   - Wrapped in `Sidebar` + `Navbar` + `PageTitle` matching `Students.tsx` layout.
   - Admin/owner gated (redirect to `/unauthorized` otherwise).
   - Single card for now: **Parent Only** — icon, title, short description, and a "Start" button that opens `AddParentOnlyForm` modal.
   - Grid layout ready to accept future onboarding cards (Family, Student, Trial, etc.) as siblings.
   - Reuses the exact modal from `src/components/parents/AddParentOnlyForm.tsx` — no changes to the form or its edge function.

2. **`src/App.tsx`**
   - Add `<Route path="/onboarding" element={<Onboarding />} />` inside the authenticated routes.

3. **`src/pages/Students.tsx`**
   - Wire the existing "Onboarding" button (line 447) to `navigate('/onboarding')`.

### Out of scope
- No changes to `AddParentOnlyForm` UI/logic.
- No new edge functions.
- No sidebar link (button on Clients page is the entry point for now).