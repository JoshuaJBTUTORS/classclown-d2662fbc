# Stop using Lovable credits for lesson plan generation

Move both lesson-plan AI calls from the Lovable AI Gateway to the direct OpenAI API using a project-owned API key, while keeping the same models and behavior.

## What changes

- **Add an `OPENAI_API_KEY` secret** to Supabase Edge Functions (user to provide; stored via Lovable secrets).
- **Refactor `supabase/functions/generate-lesson-plan/index.ts`**
  - Replace `fetch('https://ai.gateway.lovable.dev/v1/chat/completions', ...)` with `fetch('https://api.openai.com/v1/chat/completions', ...)`.
  - Use `Authorization: Bearer ${OPENAI_API_KEY}`.
  - Keep model `gpt-5-mini` and the existing tool/structured-output schema.
  - Update error handling to surface OpenAI-specific statuses (401, 429, etc.).
- **Refactor `supabase/functions/rebuild-lesson-plan-from-pdf/index.ts`**
  - Replace `fetch('https://ai.gateway.lovable.dev/v1/responses', ...)` with `fetch('https://api.openai.com/v1/responses', ...)`.
  - Use `Authorization: Bearer ${OPENAI_API_KEY}`.
  - Keep model `gpt-5.6-sol` and the existing streaming/structured-output behavior.
  - Preserve the file-input (PDF/DOCX) attachment pattern; OpenAI Responses API accepts the same `input`/`file` shapes.
- **No frontend changes** — the Edge Function URLs and contracts stay the same.
- **No database/schema changes**.

## Verification

- Deploy both Edge Functions.
- Run a small lesson-plan generation and a PDF rebuild against the direct OpenAI endpoints.
- Confirm responses are still saved to `cleo_lesson_plans` / `lesson_plans` as before.

## Notes / open questions

- The exact OpenAI model identifier for 5.6-sol may need to be confirmed at implementation time (e.g. `gpt-5.6-sol` vs a dated variant).
- `OPENAI_API_KEY` must be supplied by the project before deployment.
