# Keep teacher topic requests live during lessons

## Confirmed current state

- The teacher badge already subscribes to new, changed, and removed topic requests for the current lesson and reloads its list when an event arrives.
- The live database already publishes `topic_requests` through Supabase Realtime, and the table uses full row identity.
- Tutors have permission to read requests for lessons assigned to them.
- The Project monitoring report is based on an older version of `TopicRequestsChip.tsx` from before the subscription was added.

## Plan

1. Keep the existing immediate Realtime update, but make it resilient to temporary connection failures by refetching when the subscription reconnects.
2. Add a lightweight periodic refresh while the lesson room is open, plus an immediate refresh when the browser tab becomes active again. This ensures the badge still appears if a Realtime event is missed.
3. Preserve the current behaviour: the badge remains tutor-only, stays hidden at zero requests, and displays the latest request count and details without a page reload.
4. Verify the teacher-room flow by adding a request after the badge has mounted and confirming the hidden badge appears and updates during the same session.
5. Mark the outdated Project monitoring finding as resolved after verification.

## Technical details

- Update only `src/components/video/TopicRequestsChip.tsx`; no schema or policy change is currently required.
- Reuse one guarded loader for initial fetch, Realtime callbacks, reconnects, visibility changes, and fallback polling.
- Clean up the channel, timer, and visibility listener when leaving the room or changing lessons.
