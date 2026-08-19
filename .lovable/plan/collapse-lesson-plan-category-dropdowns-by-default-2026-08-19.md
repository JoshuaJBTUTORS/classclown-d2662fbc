# Collapse lesson plan category dropdowns by default

## Goal
On the `/lesson-plans` page, all curriculum category sections (11 Plus, GCSE, KS2, KS3) should render collapsed when the page first loads. Users can still expand them manually.

## Current state
In `src/pages/LessonPlans.tsx`, `isGroupOpen` defaults to `true` on desktop and only collapses on mobile (keeping the first group open). This causes every category to appear expanded automatically.

## Changes
1. Update the default open logic in `src/pages/LessonPlans.tsx` so every `SubjectCategorySection` starts collapsed, regardless of viewport or search state.
2. Keep search behaviour: when a search term is entered, matching groups should still expand automatically so results are visible.
3. Preserve the existing chevron/arrow animation and toggle state in `SubjectCategorySection.tsx`.

## Verification
- Open `/lesson-plans` on desktop.
- Confirm all category headers are collapsed on first load.
- Click a header and confirm it expands.
- Enter a search term and confirm matching categories expand automatically.
