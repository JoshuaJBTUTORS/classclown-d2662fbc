

## Add "Send Proposal" Button to Demo Lessons in Calendar

### What it does
When viewing a demo lesson in the calendar details dialog, a "Send Proposal" button appears. Clicking it navigates to `/admin/proposals/create` with the student's name, email, and phone pre-filled in the form.

### Changes

**1. Update `LessonDetailsDialog.tsx`**
- Add a "Send Proposal" button in the actions section, visible only for demo lessons (`lesson.lesson_type === 'demo'`) and admin/owner roles
- Also fetch `phone` and `parent_first_name`, `parent_last_name`, `parent_email` from the student query (to cover cases where the parent is the recipient)
- On click, navigate to `/admin/proposals/create` with query params: `?name=...&email=...&phone=...`
- Import `useNavigate` and `Send` icon

**2. Update `ProposalBuilder.tsx`**
- Read URL search params on mount (`useSearchParams` or `useLocation`)
- Pre-fill `recipientName`, `recipientEmail`, and `recipientPhone` from query params if present
- User can still edit all fields before submitting

**3. Update student select in lesson fetch query**
- Change from `students(id, first_name, last_name, email)` to include `phone` field so the phone number is available for the button

### Technical details
- Demo lessons are identified by `lesson.lesson_type === 'demo'`
- The first student in `validStudents` is used to populate the proposal (demos typically have one student)
- Query params approach keeps it simple — no global state needed
- Button styled with a `Send` icon, only visible to admin/owner on demo lessons
