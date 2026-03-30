

## Exception: Route Parent castrolbecky2002@yahoo.com KS2 Homework Through HeyCleo

### What we're doing

Adding a special exception so that **Serena Oyetunji (student 173)**, child of parent `castrolbecky2002@yahoo.com`, has all KS2 homework routed through HeyCleo — same as GCSE/A-Level/KS3 students.

### Two places need changes

**1. Edge Function: `supabase/functions/send-homework-notification/index.ts`**

In the HeyCleo eligibility check (~line 362-370), after checking for `gcse`/`year 11`/`ks3`, add a secondary check: if any student in the lesson has `parent.email = 'castrolbecky2002@yahoo.com'`, mark the lesson as HeyCleo-eligible regardless of subject/title.

The parent email is already fetched in the query (line 144-149), so no additional DB call needed.

```typescript
// After the existing isHeyCleoEligible check
const hasExceptionParent = homeworkData.lessons.lesson_students.some(
  (ls: any) => ls.student?.parent?.email?.toLowerCase() === 'castrolbecky2002@yahoo.com'
);
const isHeyCleoEligible = /* existing checks */ || hasExceptionParent;
```

**2. Client Component: `src/components/lessons/VideoConferenceLink.tsx`**

The `isHeyCleoLesson()` function (line 60-65) determines whether clicking the homework button opens HeyCleo or the internal homework page. We need to also check if the current user (parent) has this email.

Since the `useAuth()` hook already provides the `user` object with `user.email`, we add:

```typescript
const isHeyCleoLesson = () => {
  const title = (lessonTitle || '').toLowerCase();
  const subject = (lessonSubject || '').toLowerCase();
  const isExceptionParent = user?.email?.toLowerCase() === 'castrolbecky2002@yahoo.com';
  return title.includes('gcse') || title.includes('year 11') || title.includes('ks3') ||
         subject.includes('gcse') || subject.includes('year 11') || subject.includes('ks3') ||
         isExceptionParent;
};
```

### Summary of changes

| File | Change |
|------|--------|
| `supabase/functions/send-homework-notification/index.ts` | Add parent email exception to HeyCleo sync eligibility |
| `src/components/lessons/VideoConferenceLink.tsx` | Add parent email exception to HeyCleo redirect logic |

No database changes needed. The parent's data is already linked correctly (parent_id on student 173).

