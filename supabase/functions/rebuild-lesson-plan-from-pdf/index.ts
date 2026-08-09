import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MODEL = "openai/gpt-5.6-sol";

const ASSESSMENT_WEEKS: Record<number, string> = {
  9: "26 October 2026",
  22: "25 January 2027",
  35: "26 April 2027",
  48: "26 July 2027",
};

interface PlanRow {
  id: string;
  subject: string;
  term: string;
  week_number: number;
  topic_title: string;
  description: string | null;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["weeks", "changes"],
  properties: {
    weeks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["week_number", "term", "topic_title", "description"],
        properties: {
          week_number: { type: "integer" },
          term: { type: "string" },
          topic_title: { type: "string" },
          description: { type: ["string", "null"] },
        },
      },
    },
    changes: { type: "array", items: { type: "string" } },
  },
};

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function decodeEntities(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

async function docxToText(base64: string): Promise<string> {
  const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const zip = await JSZip.loadAsync(bytes);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("This does not look like a valid Word document.");
  const xml = await file.async("string");

  const text = xml
    .replace(/<w:tab[^>]*\/>/g, " ")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_, inner) => inner)
    .replace(/<[^>]+>/g, "");

  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const KEY_STAGE_YEARS: Record<string, number[]> = {
  ks3: [7, 8, 9],
  gcse: [10, 11],
};

/**
 * Slices a curriculum document down to the "Year N units" sections that belong
 * to the requested key stage. Returns the original text when the document does
 * not use that structure.
 */
function sliceByKeyStage(text: string, keyStage: string) {
  const years = KEY_STAGE_YEARS[keyStage];
  if (!years) return { text, detectedYears: [] as number[], unitCount: 0 };

  const headingRe = /^\s*(?:#+\s*)?\**\s*Year\s+(\d+)\s+units\**\s*$/gim;
  const marks: Array<{ year: number; start: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(text)) !== null) {
    marks.push({ year: Number(match[1]), start: match.index });
  }
  if (marks.length < 2) return { text, detectedYears: [], unitCount: 0 };

  const detectedYears: number[] = [];
  const chunks: string[] = [];
  marks.forEach((mark, i) => {
    if (!years.includes(mark.year)) return;
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    detectedYears.push(mark.year);
    chunks.push(text.slice(mark.start, end).trim());
  });

  if (chunks.length === 0) return { text, detectedYears: [], unitCount: 0 };

  const sliced = chunks.join("\n\n");
  const unitCount = (sliced.match(/^\s*(?:#+\s*)?\**\s*\d+\.\s+\S/gim) || []).length;
  return { text: sliced, detectedYears, unitCount };
}

async function callModel(
  instructions: string,
  userText: string,
  source: { kind: "pdf"; base64: string; filename: string } | { kind: "text"; text: string },
) {
  const content: unknown[] = [];
  if (source.kind === "pdf") {
    content.push({
      type: "input_file",
      filename: source.filename,
      file_data: `data:application/pdf;base64,${source.base64}`,
    });
  } else {
    content.push({
      type: "input_text",
      text: `SOURCE CURRICULUM DOCUMENT (extracted text):\n\n${source.text}`,
    });
  }
  content.push({ type: "input_text", text: userText });

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      instructions,
      input: [{ role: "user", content }],
      reasoning: { effort: "medium", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: "rebuilt_lesson_plan",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          output += evt.delta;
        } else if (evt.type === "response.completed" && !output) {
          output = evt.response?.output_text ?? "";
        }
      } catch {
        // ignore keepalive / partial frames
      }
    }
  }

  if (!output.trim()) throw new Error("The model returned an empty response. Please try again.");
  return JSON.parse(output);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { subject, pdfBase64, filename } = await req.json();

    if (!subject || typeof subject !== "string") {
      return jsonResponse({ error: "subject is required" }, 400);
    }
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return jsonResponse({ error: "pdfBase64 is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: existing, error: fetchError } = await supabase
      .from("lesson_plans")
      .select("id, subject, term, week_number, topic_title, description")
      .eq("subject", subject)
      .order("week_number", { ascending: true });

    if (fetchError) throw fetchError;

    const rows = (existing || []) as PlanRow[];
    if (rows.length === 0) {
      return jsonResponse({ error: `No existing lesson plans found for ${subject}` }, 400);
    }

    const termByWeek: Record<number, string> = {};
    rows.forEach((r) => { termByWeek[r.week_number] = r.term; });
    const weekNumbers = rows.map((r) => r.week_number);
    const minWeek = Math.min(...weekNumbers);
    const maxWeek = Math.max(...weekNumbers);

    const instructions = `You are a UK curriculum lead rebuilding an online tutoring scheme of work for "${subject}".

The attached PDF is the SOURCE OF TRUTH for topic order, topic naming and lesson structure. Rebuild the weekly plan so it matches the PDF.

Apply these rules strictly:
1. Remove any week that does not have a clear learning outcome (revision, retrieval practice, recap, catch-up, consolidation, buffer, "TBC" and similar). Do not keep them.
2. Use the PDF's format, sequence and terminology. Keep existing wording only where it already matches the PDF.
3. These four weeks MUST be assessment weeks, overwriting whatever currently sits there:
${Object.entries(ASSESSMENT_WEEKS).map(([w, d]) => `   - Week ${w} (${d})`).join("\n")}
   Title them as an assessment (e.g. "Assessment Week — <topics covered so far>") and describe what is assessed based on the preceding weeks.
4. Remove or reword anything that cannot be run online. Required practicals must become teacher demonstrations, virtual simulations, or analysis of provided results. Never instruct the student to physically carry out an experiment.

Week numbering rules:
- Week numbers are fixed to the calendar and must stay within ${minWeek}-${maxWeek}.
- When a week is removed, shift the later topics UP into the freed slot so the teaching sequence stays continuous, but the four assessment weeks above always keep their number and content.
- Output every week number from ${minWeek} to ${maxWeek} exactly once, unless the content genuinely runs out at the end (in which case output fewer trailing weeks).
- Keep the term label already attached to each week number.

Also return a short list of the notable changes you made (removals, rewordings of practicals, assessment weeks inserted).`;

    const userText = `Existing plan for ${subject} (JSON):\n${JSON.stringify(
      rows.map((r) => ({
        week_number: r.week_number,
        term: r.term,
        topic_title: r.topic_title,
        description: r.description,
      })),
      null,
      2,
    )}\n\nTerm label for each week number:\n${JSON.stringify(termByWeek)}\n\nRebuild this plan against the attached PDF following the rules.`;

    const result = await callModel(instructions, userText, pdfBase64, filename || "scheme-of-work.pdf");

    const weeks: Array<{ week_number: number; term: string; topic_title: string; description: string | null }> =
      Array.isArray(result?.weeks) ? result.weeks : [];

    if (weeks.length === 0) {
      return jsonResponse({ error: "The model did not return any weeks." }, 502);
    }

    const byWeek = new Map<number, PlanRow>();
    rows.forEach((r) => byWeek.set(r.week_number, r));

    const keptWeeks = new Set<number>();
    let updated = 0;
    let inserted = 0;

    for (const w of weeks) {
      const weekNumber = Number(w.week_number);
      if (!Number.isFinite(weekNumber)) continue;
      keptWeeks.add(weekNumber);

      const term = w.term || termByWeek[weekNumber] || rows[0].term;
      const payload = {
        subject,
        term,
        week_number: weekNumber,
        topic_title: (w.topic_title || "").trim() || `Week ${weekNumber}`,
        description: w.description ? String(w.description).trim() : null,
        updated_at: new Date().toISOString(),
      };

      const current = byWeek.get(weekNumber);
      if (current) {
        const { error } = await supabase.from("lesson_plans").update(payload).eq("id", current.id);
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase.from("lesson_plans").insert(payload);
        if (error) throw error;
        inserted++;
      }
    }

    const toDelete = rows.filter((r) => !keptWeeks.has(r.week_number)).map((r) => r.id);
    if (toDelete.length > 0) {
      const { error } = await supabase.from("lesson_plans").delete().in("id", toDelete);
      if (error) throw error;
    }

    return jsonResponse({
      success: true,
      subject,
      updated,
      inserted,
      deleted: toDelete.length,
      changes: Array.isArray(result?.changes) ? result.changes : [],
    });
  } catch (error) {
    console.error("rebuild-lesson-plan-from-pdf error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
