# Video Room Header — soften divider & align pill icons

## Goal
Two small visual fixes to `src/components/video/VideoRoomHeader.tsx`:

1. **Soften the harsh bottom divider** — the header's `border-b border-foreground/15` reads as a heavy dark band. Replace with a softer hairline (`border-foreground/10`) plus a subtle shadow, matching the lighter ClassClown divider treatment used elsewhere (e.g. the proposal sidebar).

2. **Align the icon to the start of each pill** — currently each chip has `pl-2 pr-3 gap-2` plus an inner bordered icon circle, leaving left padding before the icon and producing a double-outline "ghost ring" defect. Change chip padding to start flush at the icon: `pl-1.5 pr-3` with `gap-1.5`, and remove the icon's own border so the icon sits cleanly at the pill's leading edge inside the single pill outline.

## Scope (visual only)
- File: `src/components/video/VideoRoomHeader.tsx`
- Affects: Leave chip, date chip, participant chip, Submissions chip (all use shared `chipOutlined` / `chipIcon`).
- No changes to props, handlers, permissions, recording pill, modal, or layout structure.

## Verification
- `tsgo` typecheck passes.
- Visual check via Playwright screenshot on `/video-room/...` to confirm: soft divider, icons flush at pill start, no ghost ring.
