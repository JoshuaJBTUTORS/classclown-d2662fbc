# Plan: Redesign Video Room Header + Add Lesson Date

## Goal
Restyle the video room lesson header (`VideoRoomHeader.tsx`) to match the ClassClown design language (white surface, thin black outlines, Plus Jakarta Sans, doodle icon chips, just a hint of pastel) — replacing the current dark-teal `bg-[hsl(var(--deep-purple-blue))]` bar with white text. Also add the lesson date to the header.

## Scope
Visual-only redesign plus one new data field (lesson date). No workflow, permission, navigation, button, or handler changes.

## Current state (confirmed)
- `VideoRoomHeader.tsx` renders a dark teal bar: Leave button (left), centered title + participant/role subtitle, View Submissions button (right, tutors only).
- It does **not** show the lesson date.
- `VideoRoom.tsx` fetches the lesson via `useVideoRoom` (`select('*')`), so `lesson.start_time` is available, but it is **not** passed to `EmbeddedVideoRoom` or the header.
- `EmbeddedVideoRoom.tsx` passes `lessonTitle` only — no start time.
- Reference chip pattern (from `CalendarHero.tsx`): `chipBase` = transparent bg, `border border-foreground`, hover `bg-foreground/5`; `chipIcon` = `h-7 w-7 rounded-full border border-foreground/70`.

## Changes

### 1. Thread the lesson date through the component tree
- **`VideoRoom.tsx`**: pass `lessonStartTime={lesson?.start_time}` to `EmbeddedVideoRoom`.
- **`EmbeddedVideoRoom.tsx`**: add `lessonStartTime?: string` prop; forward it to `<VideoRoomHeader lessonStartTime={lessonStartTime} ... />`.
- **`VideoRoomHeader.tsx`**: add `lessonStartTime?: string` prop.

### 2. Redesign `VideoRoomHeader.tsx` (ClassClown)
- Replace the dark teal bar with a white card surface: `bg-background` / `bg-card`, thin bottom border `border-b border-foreground/15`, soft shadow.
- **Leave** button → outlined chip (transparent bg, `border border-foreground`, arrow-left doodle), text `text-foreground`.
- **Title** → `font-heading` (Plus Jakarta Sans), `text-foreground`, centered.
- **Date** (new) → when `lessonStartTime` present, show a compact outlined pill with a `DoodleClock` icon and the formatted date (`format(parseISO(lessonStartTime), 'EEE d MMM, h:mm a')`), placed under/beside the title using the chip pattern.
- **Participants/role** subtitle → outlined `DoodlePerson`/`Users` icon chip, muted foreground text.
- **Recording** badge → keep destructive styling but as a small outlined pill (red tint) rather than filled.
- **View Submissions** button → outlined chip with a `FileText` icon, `text-foreground`.
- Use doodle icons where available (`DoodleClock`, `DoodlePerson`, `DoodlePeople` from `LessonDoodles`) for visual consistency with the calendar/lesson modal redesign.
- Mobile: stack gracefully — keep Leave and Submissions visible, allow the title/date row to wrap; preserve the `isMobile` behavior for label hiding.

## Preserved behavior
- Leave handler, View Submissions modal trigger (tutor + recurring + lessonId gating), recording badge, participant count text, role display, mobile responsiveness — all unchanged.

## Verification
- `bunx tsgo --noEmit` for typecheck.
- Visual check of `/video-room/:lessonId` header in the preview.
