## Problem
Agent Cleo replies contain Markdown (`###`, `**bold**`, `-` lists), but `src/pages/AgentCleo.tsx` renders assistant content as raw text inside a `whitespace-pre-wrap` div. Users see the literal `###` and `**` characters instead of formatted headings, bold, and bullet lists.

## Fix
Render assistant messages as Markdown in `src/pages/AgentCleo.tsx`:

1. Add `react-markdown` + `remark-gfm` (GFM for tables/strikethrough/task lists).
2. Create a small `<MarkdownMessage>` component that wraps `ReactMarkdown` with `remarkPlugins={[remarkGfm]}` and Tailwind `prose prose-invert` classes tuned for the dark chat surface (tight spacing, no oversized headings, list/code styling that matches the ChatGPT-style bubble).
3. Replace the current assistant `<div className="... whitespace-pre-wrap">{m.content}</div>` with `<MarkdownMessage>{m.content}</MarkdownMessage>`. Keep user messages as plain `whitespace-pre-wrap` text (they never contain markdown from us).
4. Preserve current streaming behavior — `ReactMarkdown` re-renders on each delta, which is fine at this message length. Keep the `⚠️` error path as plain text (already just a short string).

No changes to the edge function, tool logic, or system prompt. This is a UI-only rendering fix.

## Technical notes
- Tailwind `@tailwindcss/typography` may not be installed; if not, style headings/lists directly via `ReactMarkdown` `components` overrides (h1–h3 → `text-base font-semibold mt-3`, `ul` → `list-disc pl-5 space-y-1`, `strong` → `font-semibold`, `code` → `bg-white/10 rounded px-1`). I'll use the component-override approach to avoid adding a Tailwind plugin.
