

## Add Extract Content Block Type for English Homework Lessons

### Problem

When English homework includes an extract (additional PDF), Cleo encounters it as the first content block but treats it like a question or regular text. She says "here is the first question" instead of "here is the extract to read."

### Solution

Add a new `extract` content block type across the system so Cleo knows when content is reading material (an extract) rather than a question or instruction.

### Changes

**1. `src/types/lessonContent.ts`**
- Add `'extract'` to the `ContentBlock.type` union type

**2. `supabase/functions/_shared/cleoPromptHelpers.ts` and `heycleo-export/edge-functions/_shared/cleoPromptHelpers.ts`**
- Add `case 'extract'` to `formatSingleBlock` that clearly labels it as an extract/reading passage:
```
case 'extract':
  description = `   • 📖 EXTRACT (Reading Passage - NOT a question):`;
  description += `\n      "${convertLatexToSpeech(data?.content || data?.text || '')}"`;
  if (data?.source) description += `\n      Source: ${data.source}`;
  description += `\n      ⚠️ INSTRUCTION: Tell the student to READ this extract on screen. Do NOT treat this as a question.`;
```

**3. `heycleo-export/edge-functions/cleo-realtime-session-token/index.ts`**
- Add extract-specific instructions to the system prompt (after the question answering protocol section, around line 698):

```
📖 EXTRACT HANDLING (CRITICAL - FOR ENGLISH HOMEWORK):

When a content block is an EXTRACT (reading passage):
- Say: "Have a look at the extract on your screen. Take your time to read through it carefully."
- Do NOT say "here's the first question" or treat it as something to answer
- Give the student 30-60 seconds of quiet reading time
- After a pause, ask: "Have you had a chance to read through that?"
- Once they confirm, say: "Great. The questions that follow will be based on this extract."
- You may briefly summarise what the extract is about to help orient them

⚠️ An extract is SOURCE MATERIAL the student reads BEFORE answering questions about it.
It is NOT a question itself. Never ask the student to "answer" the extract.
```

**4. `heycleo-export/edge-functions/generate-lesson-plan/index.ts`**
- Add `extract` as a content block type in the prompt (around line 499-515), with an example:
```
7. EXTRACT: Reading passage for students to analyze (English homework)
   Example: { type: "extract", title: "Source A", data: { content: "The passage text here...", source: "From 'Great Expectations' by Charles Dickens" } }
   - Use for homework extracts that students must read before answering questions
   - Always place BEFORE any questions that reference it
```

### Summary

| File | Change |
|------|--------|
| `src/types/lessonContent.ts` | Add `'extract'` to ContentBlock type union |
| `supabase/functions/_shared/cleoPromptHelpers.ts` | Add `extract` case to `formatSingleBlock` |
| `heycleo-export/edge-functions/_shared/cleoPromptHelpers.ts` | Same extract case |
| `heycleo-export/edge-functions/cleo-realtime-session-token/index.ts` | Add extract handling instructions to system prompt |
| `heycleo-export/edge-functions/generate-lesson-plan/index.ts` | Add extract content block type definition |

