# Topic Requests — ClassClown redesign (`/topic-requests`)

Visual-only redesign of `src/pages/TopicRequestsApproval.tsx`. All data fetching, filtering, mutations, the `send-topic-request-notification` edge call, role gating, and dialog/confirm workflows stay exactly as they are.

## Changes

### Layout & header
- Replace the `container mx-auto` shell with a full-width padded layout (`px-4 sm:px-6 lg:px-8`, `w-full min-w-0 flex-1` root so it fills MainLayout's flex row — same fix as `/staff`, `/tutors`, `/time-off-requests`).
- Add the shared `Sidebar` + `MobileMenuButton` so the page has the same navigation chrome as every other redesigned admin page (currently missing here).
- Header: `font-heading` extrabold "Topic Request Approval" title with a doodle icon chip, and muted subtitle.

### Statistics cards
- Replace the 4 plain Cards with pastel stat chips/cards: Total (sand), Pending (butter), Approved (mint), Denied (blush) — rounded `var(--radius-soft)`, soft shadows, doodle accents.

### Filters card
- Pastel surface card, doodle filter icon, rounded black-outline inputs/selects consistent with `/time-off-requests` filters. Search/status/subject logic unchanged.

### Request list
- Each request becomes a rounded pastel card: initials avatar (rotating pastel tones), student name/email, pastel "General Topic Request" chip, status chip (butter=Pending, mint=Approved, blush=Denied), requested-topic quote panel, admin notes panel, submitted/updated timestamps.
- Loading skeletons and empty state restyled (doodle empty icon, pastel surface).

### Review dialog & confirm dialogs
- `cc-dialog` scoped styling: rounded black-outline textarea, pastel topic panel, pill buttons.
- Deny = outline/pastel-blush button with black-outline Cancel and solid-black confirm; Approve = solid-black pill. AlertDialogs restyled to rounded soft surfaces. Behavior, notifications, and confirm text unchanged.

## What stays the same
- All queries, mutations, filters, stats calculations, edge-function notification, button labels, and the approve/deny confirmation flow.

## Verification
- Typecheck + build log pass. (Authenticated screenshot check unavailable — external Supabase auth.)
