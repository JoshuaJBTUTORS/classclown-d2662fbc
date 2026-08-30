# Redesign /agent-cleo with a Lighter ClassClown Feel

Visual-only redesign of the Agent Cleo chat page. All chat logic, threads, tools, lesson proposal cards, voice recording, and edge-function calls stay exactly as they are.

## What changes

1. **Light theme for the chat page**
   - Replace the dark `#212121` / `#171717` surfaces with a soft light background (cream/off-white base, white cards) matching the ClassClown design language used on /students-list, /tutors, /trial-bookings.
   - Sidebar becomes a soft white/pastel rail with subtle divider; thread rows use pastel hover/active states instead of white/10 overlays.
   - Markdown message styles, proposal cards, batch bar, and composer restyled to light equivalents (white cards, soft borders, black text, teal accents retained for confirm actions).

2. **Personalised greeting (empty state)**
   - Instead of "How can I help today?", show "Hey {first name}" using the signed-in user's first name from AuthContext (fallback: "Hey there").
   - Under it, a short positive quote that changes each day — a small local list of ~14 quotes, selected deterministically by day-of-year so it rotates daily without any backend.

3. **Light/dark preference**
   - Add a small sun/moon toggle in the header to switch between the new light theme and the current dark theme, persisted in localStorage. Default: light.

4. **Composer & empty-state suggestions**
   - Keep the same pill composer layout and suggestion grid, restyled light: white input card with soft shadow, black send button, pastel suggestion cards.

## Files touched

- `src/pages/AgentCleo.tsx` — theme tokens via a `dark` class wrapper or conditional classes, greeting + daily quote, theme toggle.
- `src/components/agentCleo/AgentCleoThreadList.tsx` — light-mode thread row styles.
- `src/components/agentCleo/DailySnapshot.tsx` — light-mode card styling so it sits correctly on the new background.

## Out of scope

- No changes to chat behaviour, tools, proposals, voice input, routing, or data fetching.
- No changes to other pages' themes.
