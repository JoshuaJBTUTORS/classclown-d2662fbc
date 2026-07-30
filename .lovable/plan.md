## Goal
Agent Cleo can currently only surface one lesson proposal per reply. When it proposes several (e.g. "move all three of Aziah's lessons to 6pm"), only the last card survives. Make it propose and apply several at a time.

## What's actually limiting it
- Backend (`supabase/functions/agent-cleo/index.ts`) already loops over every tool call in a turn and emits one `proposal` / `edit_proposal` SSE event per call — so multiple events can already be sent.
- Frontend (`src/pages/AgentCleo.tsx`) stores `proposal`, `editProposal`, `proposalState` and `proposalMessage` as single fields on a message (lines 95-98, 417-426). Each new SSE event overwrites the previous one, and one shared `proposalState` means the cards could not track their own status anyway.

## Frontend changes (`src/pages/AgentCleo.tsx`)
- Replace the single-proposal fields on `Msg` with one list: `proposals: Array<{ id: string; kind: 'create' | 'edit'; data: LessonProposal | LessonEditProposal; state: ProposalState; message?: string | null }>`.
- On `proposal` / `edit_proposal` SSE events, append an entry instead of overwriting.
- Render the list in order, reusing `LessonProposalCard` and `LessonEditProposalCard` unchanged, each driven by its own state; number them ("Proposal 1 of 3") when there is more than one.
- `confirmProposal` / `confirmEditProposal` / `cancelProposal` take the proposal entry id and update only that entry.
- When a message has 2+ pending proposals, show a **Confirm all** / **Cancel all** bar above the cards. "Confirm all" applies them sequentially (so create and edit calls don't race on the same lesson series), each card moving through confirming → applied/failed independently; a failure does not stop the remaining ones, and the bar ends with a short "x applied, y failed" line.

## Backend changes (`supabase/functions/agent-cleo/index.ts`)
- System prompt: allow and encourage batching — when the user's request clearly covers several lessons, call `propose_lesson` / `propose_lesson_edit` once per lesson in the same turn (all IDs still resolved by querying first), then reply with ONE short sentence covering all the cards. Keep the rule of asking a clarifying question rather than guessing, and add a cap of 10 proposals per turn, asking to narrow the request beyond that.
- Tool result note: change the wording to say cards (plural) may be shown and nothing has been created or changed yet.
- Keep the per-call validation exactly as it is; an invalid proposal in a batch still returns its error to the model without blocking the valid ones.

## Unchanged
Confirmation still goes through `agent-cleo-create-lesson` for creates and `recurringLessonEditService` for edits, so calendar parity (LessonSpace rooms, participant links, enrollment notifications) is identical.
