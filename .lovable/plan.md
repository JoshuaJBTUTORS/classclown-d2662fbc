## Plan: make Agent Cleo database lookup work reliably

I checked the live Agent Cleo path and found the read-only database RPC exists, but it currently has no visible routine privileges from the database metadata, and direct read-query access gets `permission denied for function agent_cleo_exec`. The edge function also hides exact tool errors behind the generic “database lookup is failing” message.

### What I will change

1. **Repair database access for the Edge Function**
   - Add a small migration to grant execution of `public.agent_cleo_exec(text)` to the correct server role used by the `agent-cleo` edge function.
   - Keep the RPC read-only guard in place so Agent Cleo can read CRM data but cannot write, update, delete, or call sensitive/internal schemas.

2. **Make Agent Cleo show the real database error during failures**
   - Update `supabase/functions/agent-cleo/index.ts` so tool failures are logged and surfaced more clearly to the assistant response instead of collapsing into “database lookup is failing.”
   - This will make future errors actionable instead of vague.

3. **Deploy and test the edge function**
   - Deploy `agent-cleo` after code changes.
   - Test the `/agent-cleo` function using the same kind of question from the screenshot: “any KS3 maths groups on Thursday?”
   - Confirm the tool can list schema, inspect lesson-related tables, and query lessons.

4. **Report verified outcome**
   - If the authenticated preview token is available, I’ll verify the full admin/owner path end-to-end.
   - If auth is not available to the test tool, I’ll still verify the database function permission and edge function deploy, and mark the browser-auth path separately as unverified.