
# Expand HeyCleo Homework Sync to KS3

## What This Changes

Currently, when homework is assigned, the system only syncs it to the HeyCleo platform for GCSE and Year 11 lessons. This change expands that to also include all KS3 subjects (KS3 Maths, KS3 English, KS3 Science, KS3 Geography).

There are 261 scheduled KS3 lessons in the system right now (104 Maths, 96 Science, 61 English), so this will apply to a significant number of lessons going forward.

## What Gets Updated

### 1. Homework sync to HeyCleo (backend)
The edge function that sends homework data to HeyCleo will be updated to also trigger for KS3 lessons. When a tutor assigns homework to a KS3 lesson, it will now be synced to HeyCleo just like GCSE homework is today.

### 2. Homework button behaviour (frontend)
The homework button on the lesson card currently redirects to HeyCleo for GCSE/Year 11 lessons, and to the internal homework page for everything else. This will be updated so KS3 lessons also redirect to HeyCleo.

## Technical Details

### File 1: `supabase/functions/send-homework-notification/index.ts`
- Rename the detection variable from `isGcseOrYear11` to `isSyncEligible` (or similar)
- Add `ks3` to the detection check alongside `gcse` and `year 11`
- Update log messages to reflect the expanded scope

The detection logic changes from:
```
lessonTitle.includes('gcse') || lessonTitle.includes('year 11') ||
lessonSubject.includes('gcse') || lessonSubject.includes('year 11')
```
to:
```
lessonTitle.includes('gcse') || lessonTitle.includes('year 11') ||
lessonTitle.includes('ks3') ||
lessonSubject.includes('gcse') || lessonSubject.includes('year 11') ||
lessonSubject.includes('ks3')
```

### File 2: `src/components/lessons/VideoConferenceLink.tsx`
- Same pattern change: add `ks3` to the `isGcseOrYear11Lesson` check (and rename the function to something like `isHeyCleoLesson`)

### Deployment
- The edge function `send-homework-notification` will be redeployed after the change

## No Database Changes Required
The KS3 subjects already exist in the lessons table with the right naming format (`KS3 Maths`, `KS3 English`, `KS3 Science`), so no data migration is needed.
