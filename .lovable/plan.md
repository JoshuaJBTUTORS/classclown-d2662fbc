## Goal

Replace the three hard-coded sidebar entries ("Weekly overview", "Trial follow-ups", "Tutor payroll July") in `/agent-cleo` with real, saved conversations that survive refresh and follow the admin across devices.

## What the user sees

- Sidebar "Recent" lists your actual past conversations, newest first, each titled from the first question asked.
- Clicking one loads its full message history back into the chat.
- "New chat" starts a fresh thread; it appears in the list as soon as the first message is sent (no empty ghost threads).
- Hovering a thread shows a rename and delete control.
- Each conversation has its own URL (`/agent-cleo/:threadId`), so reloading or bookmarking returns to that exact chat.

## Technical details

Database (two new tables, scoped to the signed-in user via RLS):
- `agent_cleo_threads` — `user_id`, `title`, `created_at`, `updated_at`.
- `agent_cleo_messages` — `thread_id`, `role`, `content`, `created_at`. Server-generated UUID primary keys.
- Grants for `authenticated` + `service_role`; policies restrict all reads/writes to `auth.uid() = user_id` (messages checked through their parent thread).

Frontend (`src/pages/AgentCleo.tsx`, plus a small `useAgentCleoThreads` hook and a `ThreadList` component):
- Add route `/agent-cleo/:threadId` alongside `/agent-cleo`; active thread ID comes from the route param via `useParams`, and thread creation/selection navigates with `useNavigate`.
- On first send in a new chat, insert the thread (title = first ~50 chars of the message), navigate to its URL, then persist messages.
- Persist both the user message and the assistant reply after each turn; surface insert errors as a toast rather than failing silently.
- Loading a thread fetches its messages ordered by `created_at` and remounts the chat keyed by thread ID so messages can't bleed between threads.
- Lesson create/edit proposal cards stay in-session only (they're transient approval UI); saved history keeps the plain text turns.

Out of scope: no change to the `agent-cleo` edge function, tools, or approval flow.
