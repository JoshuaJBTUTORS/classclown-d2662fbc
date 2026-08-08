# Fix: first message disappears in a new Agent Cleo chat

## What's wrong

When you send the first message in a brand-new chat, the page creates the thread and changes the URL to `/agent-cleo/<new-id>`. That URL change triggers the "restore this conversation" logic, which reloads the conversation from the database and replaces whatever is on screen. At that moment the database has not finished storing your message yet, so the screen is wiped back to empty while the reply streams in invisibly. Clicking away and back re-reads the database, which by then has the message, so everything reappears.

## The fix

Make the restore step ignore the URL change that the page itself just caused when creating a new chat. Restoring from the database should only happen when you actually open an existing chat (sidebar click, reload, direct link), never immediately after sending the first message in a new one.

Also make the first user message write complete before the assistant reply is saved, so the stored order stays correct.

## Technical details

In `src/pages/AgentCleo.tsx`:

- Add a ref (e.g. `justCreatedThreadRef`) set to the new thread id in `handleSend` right before `navigate('/agent-cleo/<id>', { replace: true })`.
- In the restore `useEffect` (lines ~399-413), return early (clearing the ref) when `threadId === justCreatedThreadRef.current`, so the local optimistic + streaming messages survive.
- Keep `activeThreadRef` assignment for other paths unchanged.
- Await the `saveMessage(currentThread, 'user', text)` call (or chain the assistant save after it) instead of firing it off unawaited, so message ordering is stable on later reloads.

No backend, schema, or edge function changes.
