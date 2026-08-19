# Teacher View access: tutor, admin, owner

## Current state (verified)

- `/calendar` itself has no role restriction — any signed-in user can open the page.
- Inside `src/pages/Calendar.tsx`, the Teacher View tab is gated by `canUseTeacherView = userRole === 'admin' || userRole === 'owner'`.
- The gate is applied in two places: the tab trigger and the tab content, so parents and students cannot reach the teacher/availability view today.
- Tutors are currently **excluded** — they cannot see Teacher View, which does not match the desired rule.

## Change

Widen the Teacher View gate to include tutors:

```
const canUseTeacherView = userRole === 'admin' || userRole === 'owner' || userRole === 'tutor';
```

Both the `TabsTrigger` and the `TabsContent` already use this flag, so tutors gain access and parents/students remain blocked with a single edit.

## Out of scope

- The rest of the calendar page stays open to all signed-in roles (as today).
- Lesson scheduling stays admin/owner only (`canScheduleLessons` unchanged).
- Filter permissions unchanged.
