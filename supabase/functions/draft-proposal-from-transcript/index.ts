import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-3-flash";
const MAX_CHARS = 120_000;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

interface Segment {
  start_time?: number | string;
  end_time?: number | string;
  user?: { name?: string } | null;
  text?: string;
}

function toSeconds(v: unknown): number {
  if (typeof v === "number") return v > 100000 ? v / 1000 : v;
  const n = Number(v);
  return Number.isFinite(n) ? (n > 100000 ? n / 1000 : n) : 0;
}

function stamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function flatten(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      return flatten(JSON.parse(raw));
    } catch {
      return raw;
    }
  }
  if (Array.isArray(raw)) {
    const lines = (raw as Segment[])
      .filter((s) => s && typeof s.text === "string" && s.text.trim())
      .map((s) => {
        const who = s.user?.name?.trim() || "Speaker";
        return `[${stamp(toSeconds(s.start_time))}] ${who}: ${s.text!.trim()}`;
      });
    return lines.join("\n");
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["segments", "transcript", "data", "results"]) {
      if (obj[key]) return flatten(obj[key]);
    }
  }
  return "";
}

const SYSTEM = `You extract the commercial details of a tutoring discovery/trial conversation so an admin can draft a proposal.

CRITICAL RULES:
- Speaker labels in the transcript are UNRELIABLE. The account manager often joins through the tutor's account, so their speech is attributed to the tutor. Infer who is who from the CONTENT of what is said (the person quoting prices and explaining the platform is the account manager; the person asking about their child is the parent), never from the name label.
- Only extract from the discovery conversation about the student named in the booking context. A single recording can contain unrelated adjacent sessions in the same virtual space. If you cannot find a discovery conversation for this booking, set found_discovery to false and leave fields null.
- NEVER invent a value. If something was not said, use null and mark it missing.
- Email addresses, phone numbers and names spelled out aloud are frequently garbled by the transcription. Always give these confidence "low".
- For each field you fill, include the verbatim quote from the transcript it came from and its [MM:SS] timestamp.
- Days must be full English weekday names ("Monday"). Times must be 24-hour "HH:MM" strings. Duration is in minutes (default 60 when a one hour session is described).
- price_per_lesson is the per-lesson price in GBP for the term recommended. contract_term must be one of month_to_month, 3_months, 12_months.
- lesson_times must contain one row PER WEEKLY SESSION. If a subject rotates across weeks in one recurring slot, still emit one row for that slot and name the rotation in the subject (e.g. "Economics / Computer Science / Geography (rotating)").`;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    found_discovery: { type: "boolean" },
    summary: { type: "string" },
    fields: {
      type: "object",
      additionalProperties: false,
      properties: {
        recipient_name: { $ref: "#/$defs/field" },
        recipient_email: { $ref: "#/$defs/field" },
        recipient_phone: { $ref: "#/$defs/field" },
        student_name: { $ref: "#/$defs/field" },
        year_group: { $ref: "#/$defs/field" },
        subjects: { $ref: "#/$defs/field" },
        exam_boards: { $ref: "#/$defs/field" },
        lesson_type: { $ref: "#/$defs/field" },
        lessons_per_week: { $ref: "#/$defs/field" },
        preferred_times: { $ref: "#/$defs/field" },
        blocked_days: { $ref: "#/$defs/field" },
        rotation_pattern: { $ref: "#/$defs/field" },
        contract_term: { $ref: "#/$defs/field" },
        price_per_lesson: { $ref: "#/$defs/field" },
        payment_cycle: { $ref: "#/$defs/field" },
      },
      required: [
        "recipient_name",
        "recipient_email",
        "recipient_phone",
        "student_name",
        "year_group",
        "subjects",
        "exam_boards",
        "lesson_type",
        "lessons_per_week",
        "preferred_times",
        "blocked_days",
        "rotation_pattern",
        "contract_term",
        "price_per_lesson",
        "payment_cycle",
      ],
    },
    lesson_times: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "string" },
          time: { type: "string" },
          duration: { type: "number" },
          subject: { type: "string" },
          quote: { type: ["string", "null"] },
          timestamp: { type: ["string", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["day", "time", "duration", "subject", "quote", "timestamp", "confidence"],
      },
    },
    notes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["commitment", "open_question", "objection", "other"] },
          text: { type: "string" },
          timestamp: { type: ["string", "null"] },
        },
        required: ["kind", "text", "timestamp"],
      },
    },
  },
  required: ["found_discovery", "summary", "fields", "lesson_times", "notes"],
  $defs: {
    field: {
      type: "object",
      additionalProperties: false,
      properties: {
        value: { type: ["string", "null"] },
        quote: { type: ["string", "null"] },
        timestamp: { type: ["string", "null"] },
        confidence: { type: "string", enum: ["high", "medium", "low", "missing"] },
      },
      required: ["value", "quote", "timestamp", "confidence"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId } = await req.json();
    if (!lessonId) {
      return json({ error: "lessonId is required" }, 400);
    }

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, title, subject, lesson_type, scheduled_date, start_time, end_time, lesson_space_session_id, tutor_id")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonError) throw lessonError;
    if (!lesson) return json({ error: "Lesson not found" }, 404);

    const { data: transcription } = await supabase
      .from("lesson_transcriptions")
      .select("transcription_text, transcription_status")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let text = flatten(transcription?.transcription_text);

    // Fall back to a transcript stored against the same LessonSpace session
    if (!text && lesson.lesson_space_session_id) {
      const { data: shared } = await supabase
        .from("lesson_transcriptions")
        .select("transcription_text")
        .eq("session_id", lesson.lesson_space_session_id)
        .not("transcription_text", "is", null)
        .limit(1);
      text = flatten(shared?.[0]?.transcription_text);
    }

    if (!text || text.trim().length < 200) {
      return json({
        error: "no_transcript",
        message: "No usable transcript is available for this lesson yet.",
      }, 200);
    }

    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

    // Booking context (students on the lesson)
    const { data: participants } = await supabase
      .from("lesson_students")
      .select("students(first_name, last_name, email, phone, year_group)")
      .eq("lesson_id", lessonId);

    const students = (participants || [])
      .map((p: any) => p.students)
      .filter(Boolean);

    const context = {
      lesson_title: lesson.title,
      subject: lesson.subject,
      lesson_type: lesson.lesson_type,
      date: lesson.scheduled_date,
      start_time: lesson.start_time,
      students,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `BOOKING CONTEXT (confirmed record, wins over the transcript for student name / subject):\n${JSON.stringify(context, null, 2)}\n\nTRANSCRIPT:\n${text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "proposal_draft", strict: true, schema },
        },
      }),
    });

    if (res.status === 429) {
      return json({ error: "rate_limited", message: "AI rate limit reached, please try again shortly." }, 429);
    }
    if (res.status === 402) {
      return json({ error: "payment_required", message: "AI credits exhausted." }, 402);
    }
    if (!res.ok) {
      const body = await res.text();
      console.error("AI gateway error", res.status, body);
      return json({ error: "ai_error", message: `AI request failed (${res.status})` }, 500);
    }

    const payload = await res.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return json({ error: "ai_error", message: "Empty AI response" }, 500);

    let draft: any;
    try {
      draft = JSON.parse(content);
    } catch {
      return json({ error: "ai_error", message: "Could not parse AI response" }, 500);
    }

    // Booking record wins for the fields we already know
    const primary = students[0];
    if (primary) {
      const bookingName = `${primary.first_name ?? ""} ${primary.last_name ?? ""}`.trim();
      if (bookingName) {
        draft.fields.student_name = {
          value: bookingName,
          quote: draft.fields.student_name?.quote ?? null,
          timestamp: draft.fields.student_name?.timestamp ?? null,
          confidence: "high",
        };
      }
      if (primary.email) {
        draft.fields.recipient_email = {
          value: primary.email,
          quote: draft.fields.recipient_email?.quote ?? null,
          timestamp: draft.fields.recipient_email?.timestamp ?? null,
          confidence: "high",
        };
      }
      if (primary.phone) {
        draft.fields.recipient_phone = {
          value: primary.phone,
          quote: draft.fields.recipient_phone?.quote ?? null,
          timestamp: draft.fields.recipient_phone?.timestamp ?? null,
          confidence: "high",
        };
      }
    }

    return json({ success: true, draft, context });
  } catch (e) {
    console.error("draft-proposal-from-transcript error", e);
    return json({ error: "server_error", message: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
