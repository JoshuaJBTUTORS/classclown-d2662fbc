## What's actually going wrong

It isn't the chat-persistence work. The network log shows the message request going to a **relative** URL:

```text
POST /functions/v1/agent-cleo  →  200, body = index.html
```

`src/pages/AgentCleo.tsx` builds its endpoints from an env var:

```ts
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-cleo`;
const CREATE_LESSON_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-cleo-create-lesson`;
```

In the built preview bundle `VITE_SUPABASE_URL` is empty, so the URL collapses to a same-origin path and Vite's SPA fallback answers with the HTML page. Because that response is `200` with a body, the code's `!resp.ok || !resp.body` guard passes, the SSE reader finds no `data:` lines, and the assistant bubble just stays empty — no visible error. (A hardcoded fallback was added for this before and has since been lost from the file.)

`src/integrations/supabase/client.ts` already hardcodes the project URL, which is why every other Supabase call still works.

## Fix

1. In `src/pages/AgentCleo.tsx`, stop relying on the env var. Derive the functions base from the same constant the Supabase client uses (import/duplicate `https://sjxbxkpegcnnfjbsxazo.supabase.co`), with `import.meta.env.VITE_SUPABASE_URL` only as an optional override.
2. Harden the streaming call so a silent failure can't happen again: after the fetch, reject any response whose `content-type` isn't `text/event-stream`, and surface the error in the chat bubble plus a toast.
3. Apply the same base-URL fix to the create-lesson endpoint.
4. Check the rest of `src/` for other `import.meta.env.VITE_SUPABASE_URL` usages and give them the same fallback.

## Verify

Send a message in Agent Cleo and confirm the request goes to the full `https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/agent-cleo` URL, streams a reply, and that the reply is saved into `agent_cleo_messages` for the current thread.