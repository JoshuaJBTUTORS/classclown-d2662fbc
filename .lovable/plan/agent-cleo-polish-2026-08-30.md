# Agent Cleo polish

Four changes on `/agent-cleo`, visual and wiring only — chat logic, tools and data fetching stay untouched.

## 1. Side panel buttons all work

Current state of the sidebar:
- Close sidebar, New chat (both the icon and the row), Open CRM, and each recent-chat select / rename / delete already work.
- The "Agent Cleo" row at the bottom is styled as clickable (hover highlight, pointer cursor) but has no action.

Fix: make that footer row a real button that opens a small menu with working actions — Toggle light/dark (reuses the existing theme toggle) and Open CRM. No new backend behaviour.

## 2. Today tiles restyled to the calendar "Request topic" chip

The four snapshot tiles (Sessions today, Trials today, Time off, Proposals signed) and the Team goals header become the same outlined pill/chip language used on the calendar page: transparent background, full black outline, circular outlined icon badge on the left, subtle lift on hover.

- Tiles keep their number, sub-label, loading skeleton and navigation targets.
- The label + icon row inside each tile adopts the chip treatment (rounded outlined icon circle, uppercase muted label).
- "Team goals →" and the refresh control become small outlined chips too.
- Goal rows, targets and status badges keep their current logic and colours.

## 3. Animated waving hand next to "Hey {name}"

Add a waving hand beside the typed greeting, using the same wave animation as the shared `LoadingHand` loader so it matches the rest of the app. It sits inline to the right of the heading and waves continuously.

## 4. Soft blue initial avatar

The greeting avatar, the sidebar "C" badge and the in-chat avatars change from the teal/emerald gradient to a soft blue gradient. The photo-based avatar (when the account has one) is unaffected.

## Technical notes

- Files: `src/pages/AgentCleo.tsx`, `src/components/agentCleo/DailySnapshot.tsx`, and a small wave keyframe reuse from `src/index.css` (already defined for `LoadingHand`).
- The Agent Cleo screen uses its own local palette rather than global tokens, so the chip styles are mirrored locally with the same shape/weights as `CalendarHero`.
- Verify with a typecheck plus a screenshot of `/agent-cleo` in light and dark mode.
