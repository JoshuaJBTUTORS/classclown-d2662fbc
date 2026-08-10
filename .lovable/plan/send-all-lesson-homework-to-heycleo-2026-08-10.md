# Send all lesson homework to HeyCleo

Currently the "View Homework" button in the lesson dialogue only opens HeyCleo for lessons whose title or subject mentions GCSE, Year 11 or KS3 (plus one hard-coded parent email). Every other lesson sends the user to the internal `/homework` page — which parents can no longer access, so they hit "Access Denied".

## Change

Every lesson's "View Homework" button opens HeyCleo (single sign-on, new tab), regardless of subject or year group. No more internal homework redirect from the lesson dialogue.

## Technical detail

In `src/components/lessons/VideoConferenceLink.tsx`:
- Remove the `isHeyCleoLesson()` eligibility check (including the hard-coded exception email).
- `handleHomeworkClick` always calls `heyCleoRedirectService.redirectToHeyCleoHomework()`.
- Drop the now-unused `navigate('/homework')` path (and the `useNavigate` import if nothing else uses it).

No backend, schema or edge function changes.
