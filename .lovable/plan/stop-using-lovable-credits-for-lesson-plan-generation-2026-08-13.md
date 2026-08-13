# Stop using Lovable credits for lesson plan generation

Both lesson-plan AI calls move from the Lovable AI Gateway to the direct OpenAI API. No new key is needed — `OPENAI_API_KEY` is already configured as a Supabase secret and is used today by `generate-lesson-summaries`, `agent-cleo`, `refresh-assessment`, `ai-mark-assessment` and others.

## What changes

- **`generate-lesson-plan`**
  - Both gateway calls (main generation and the exam-practice retry) point at `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer ${OPENAI_API_KEY}`.
  - Model `openai/gpt-5-mini` becomes `gpt-5-mini` (the gateway's vendor prefix is dropped for direct calls, exactly as `agent-cleo` uses `gpt-5.6`).
  - Tool schema, `tool_choice`, prompts and all downstream parsing/persistence stay identical.
  - The 402 "add Lovable AI credits" error message is replaced with a generic OpenAI billing/auth message; 429 handling stays.

- **`rebuild-lesson-plan-from-pdf`**
  - The streaming call moves to `https://api.openai.com/v1/responses` with `Authorization: Bearer ${OPENAI_API_KEY}`; the `Lovable-API-Key` and `X-Lovable-AIG-SDK` headers are removed.
  - Model `openai/gpt-5.6-sol` becomes `gpt-5.6-sol`.
  - Streaming SSE parsing, PDF/DOCX `input_file` attachment, reasoning settings and the strict `json_schema` output all stay as they are.

- No frontend, config or database changes.

## Verification

- Run one lesson-plan generation and confirm the plan saves as before.
- Run one PDF rebuild for a subject and confirm the weeks are rewritten.
- Check edge function logs for auth/model errors; if OpenAI rejects a model id directly, fall back to the closest available id and report back rather than reverting to the gateway.
