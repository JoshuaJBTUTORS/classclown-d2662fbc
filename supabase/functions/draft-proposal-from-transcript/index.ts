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

const MODEL = "google/gemini-2.5-flash";
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

// Mirrors src/constants/subjects.ts — the only subject names our system uses.
const CANONICAL_SUBJECTS = [
  "Early KS2 Maths", "Early KS2 English",
  "KS2 Maths", "KS2 English",
  "Sats Maths", "Sats English",
  "11 Plus Maths", "11 Plus English", "11 Plus VR", "11 Plus NVR",
  "KS3 Maths", "KS3 English", "KS3 Science", "KS3 Geography",
  "GCSE Maths Highier", "GCSE Maths Foundation", "GCSE English",
  "GCSE Combined Science", "GCSE Computer Science", "GCSE Geography",
  "GCSE Business", "GCSE Economics", "GCSE Physics", "GCSE Chemistry", "GCSE Biology",
  "Year 11 Maths Highier", "Year 11 Maths Foundation", "Year 11 English",
  "Year 11 Combined Science", "Year 11 Physics", "Year 11 Biology", "Year 11 Chemistry",
  "A-level Maths", "A-level Biology", "A-level Chemistry", "A-level Physics",
  "A-level Computer Science", "A-level Geography", "A-level Business", "A-level Economics",
];

const CANONICAL_SET = new Set(CANONICAL_SUBJECTS.map((s) => s.toLowerCase()));

function bandFromYearGroup(raw: unknown): string | null {
  const text = String(raw ?? "").toLowerCase();
  const match = text.match(/(?:year|yr|y|grade)\s*(\d{1,2})/) || text.match(/\b(\d{1,2})\b/);
  const year = match ? Number(match[1]) : NaN;
  if (!Number.isFinite(year)) {
    if (text.includes("a-level") || text.includes("a level")) return "a_level";
    if (text.includes("gcse")) return "gcse";
    if (text.includes("ks3")) return "ks3";
    if (text.includes("11 plus") || text.includes("11+")) return "11_plus";
    if (text.includes("ks2") || text.includes("sats")) return "ks2";
    return null;
  }
  if (year <= 2) return "early_ks2";
  if (year <= 4) return "early_ks2";
  if (year <= 6) return text.includes("11 plus") || text.includes("11+") ? "11_plus" : "ks2";
  if (year <= 9) return "ks3";
  if (year <= 11) return "gcse";
  return "a_level";
}

function isCanonicalSubject(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  const parts = raw.replace(/\(rotating\)/i, "").split("/").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((p) => CANONICAL_SET.has(p.toLowerCase()));
}


const SYSTEM = `You extract the commercial details of a tutoring discovery/trial conversation so an admin can draft a proposal.

CRITICAL RULES:
- Speaker labels in the transcript are UNRELIABLE. The account manager often joins through the tutor's account, so their speech is attributed to the tutor. Infer who is who from the CONTENT of what is said (the person quoting prices and explaining the platform is the account manager; the person asking about their child is the parent), never from the name label.
- Only extract from the discovery conversation about the student named in the booking context. A single recording can contain unrelated adjacent sessions in the same virtual space. If you cannot find a discovery conversation for this booking, set found_discovery to false and leave fields null.
- NEVER invent a value. If something was not said, use null and mark it missing.
- Email addresses, phone numbers and names spelled out aloud are frequently garbled by the transcription. Always give these confidence "low".
- For each field you fill, include the verbatim quote from the transcript it came from and its [MM:SS] timestamp.
- Days must be full English weekday names ("Monday"). Times must be 24-hour "HH:MM" strings. Duration is in minutes (default 60 when a one hour session is described).
- price_per_lesson is the per-lesson price in GBP for the term recommended. contract_term must be one of month_to_month, 3_months, 12_months, 24_months.

PRICE RESOLUTION (mandatory when more than one number is heard):
- The settled price is the LAST price the account manager states that the parent acknowledges or does not push back on. Later statements override earlier ones.
- Prefer the price stated for the term/commitment that is actually being recommended (e.g. the 3 month rate when 3 months was agreed) over prices quoted for other terms.
- Ignore prices that are framed as: the standard/list rate before a discount, a different lesson type (1-1 vs group) than the one agreed, a hypothetical ("if you did four a week it would be..."), or a competitor's price the parent mentions.
- Only convert a monthly or weekly total into a per-lesson figure when the number of lessons is unambiguous; otherwise keep the per-lesson figure that was actually said aloud.
- price_per_lesson.candidates must list EVERY distinct price figure heard in the call, including the one you chose, each with its verbatim quote, [MM:SS] timestamp and a one line reason_rejected explaining why it was or was not selected (write "selected" for the chosen one).
- price_per_lesson.confidence: "high" only when the parent explicitly confirms the number; "medium" when the account manager states it last and it goes unchallenged; "low" when it was derived, inferred, or several numbers were still live at the end of the call. When there is more than one candidate, confidence may NOT be "high" unless the parent verbally confirmed the chosen figure.
- lesson_times must NEVER be empty when a weekly pattern was agreed. Build one row PER WEEKLY SESSION from whatever was said: if the number of lessons per week and a preferred time were agreed but exact weekdays were not named, still emit that many rows using the agreed time and your best-guess weekdays (spread across the week, avoiding any days the parent ruled out) and mark those rows confidence "low" so the admin corrects them.
- lesson_times must contain one row PER WEEKLY SESSION. If a subject rotates across weeks in one recurring slot, still emit one row for that slot and name the rotation in the subject (e.g. "Economics / Computer Science / Geography (rotating)").

YEAR GROUP AND SUBJECT MAPPING (mandatory):
- THE TRANSCRIPT IS THE SOURCE OF TRUTH for the student's year group and for which subjects are being bought. The booking record's year group and the subject the trial was booked under are frequently wrong (a trial booked as "KS3 Maths" for a Year 6 child, a stale year on the student record). If the call states or implies a year group, school year, age or school stage, USE THAT, even when it contradicts the booking context. Only fall back to record_year_group when the call says nothing at all about the year.
- Normalise year_group to "Year N" (English school years, Year 1 to Year 13). If only an age or school stage is mentioned, infer the year and mark confidence "low".
- Set year_band to exactly one of: early_ks2, ks2, 11_plus, ks3, gcse, a_level, using this mapping applied to the RESOLVED year group (the one from the call):
  * Year 3-4 -> early_ks2
  * Year 5-6 -> ks2 by default; use 11_plus instead when the parent mentions 11 plus, entrance exams, grammar school, independent/private school entry, VR or NVR
  * Year 6 preparing for SATs -> ks2 (use the Sats subjects)
  * Year 7-9 -> ks3
  * Year 10-11 -> gcse
  * Year 12-13 -> a_level
- subject_list must contain EVERY subject the parent agreed to on the call, one entry per subject. Include subjects added during the call on top of the subject the trial was booked under, and EXCLUDE any subject the parent declined or only asked about. Never copy the booked trial subject into subject_list unless the call confirms it.
- Every subject you write, in subject_list and in EVERY lesson_times[].subject, must be an exact name from this canonical list, banded to the RESOLVED year band (never the band the trial was booked under):
${CANONICAL_SUBJECTS.join(", ")}
- Band prefixes: early_ks2 -> "Early KS2 ..."; ks2 -> "KS2 ..." (use "Sats Maths"/"Sats English" when SATs preparation is the stated goal); 11_plus -> "11 Plus Maths / English / VR / NVR"; ks3 -> "KS3 ..."; gcse -> "GCSE ..."; a_level -> "A-level ...".
- Never output a bare subject like "Maths", "English" or "Science" — always the banded name (e.g. Year 10 maths becomes "GCSE Maths Highier" or "GCSE Maths Foundation", Year 7 science becomes "KS3 Science", Year 6 maths becomes "KS2 Maths").
- For GCSE maths pick Higher or Foundation from what was said; if it was not said, default to "GCSE Maths Highier" and mark it low confidence.
- If a requested subject has no equivalent in the list for that band (e.g. GCSE History), write the closest sensible banded name and mark it low confidence.
- For rotating slots, join the canonical names with " / " and append " (rotating)".`;


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
        recipient_name: {
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
        recipient_email: {
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
        recipient_phone: {
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
        student_name: {
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
        year_group: {
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
        year_band: {
          type: "object",
          additionalProperties: false,
          properties: {
            value: {
              type: ["string", "null"],
              enum: ["early_ks2", "ks2", "11_plus", "ks3", "gcse", "a_level", null],
            },
            quote: { type: ["string", "null"] },
            timestamp: { type: ["string", "null"] },
            confidence: { type: "string", enum: ["high", "medium", "low", "missing"] },
          },
          required: ["value", "quote", "timestamp", "confidence"],
        },
        subject_list: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              value: { type: "string" },
              quote: { type: ["string", "null"] },
              timestamp: { type: ["string", "null"] },
              confidence: { type: "string", enum: ["high", "medium", "low", "missing"] },
            },
            required: ["value", "quote", "timestamp", "confidence"],
          },
        },
        subjects: {
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
        exam_boards: {
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
        lesson_type: {
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
        lessons_per_week: {
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
        preferred_times: {
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
        blocked_days: {
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
        rotation_pattern: {
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
        contract_term: {
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
        price_per_lesson: {
          type: "object",
          additionalProperties: false,
          properties: {
            value: { type: ["string", "null"] },
            quote: { type: ["string", "null"] },
            timestamp: { type: ["string", "null"] },
            confidence: { type: "string", enum: ["high", "medium", "low", "missing"] },
            candidates: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  value: { type: ["string", "null"] },
                  quote: { type: ["string", "null"] },
                  timestamp: { type: ["string", "null"] },
                  reason_rejected: { type: ["string", "null"] },
                },
                required: ["value", "quote", "timestamp", "reason_rejected"],
              },
            },
          },
          required: ["value", "quote", "timestamp", "confidence", "candidates"],
        },
        payment_cycle: {
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
      required: [
        "recipient_name",
        "recipient_email",
        "recipient_phone",
        "student_name",
        "year_group",
        "year_band",
        "subject_list",
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
      .select("id, title, subject, lesson_type, start_time, end_time, lesson_space_session_id, tutor_id")
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
      .select("students(first_name, last_name, email, phone, grade)")
      .eq("lesson_id", lessonId);

    const students = (participants || [])
      .map((p: any) => p.students)
      .filter(Boolean);

    const recordYearGroup = (students[0] as any)?.grade ?? null;
    const recordBand = bandFromYearGroup(recordYearGroup);

    const context = {
      lesson_title: lesson.title,
      booked_trial_subject: lesson.subject,
      lesson_type: lesson.lesson_type,
      date: lesson.start_time,
      start_time: lesson.start_time,
      students,
      record_year_group: recordYearGroup,
      record_year_band: recordBand,
      note:
        "Contact details (parent name, email, phone) from this record are authoritative. booked_trial_subject, record_year_group and record_year_band are REFERENCE ONLY and are often wrong: the trial may have been booked under the wrong band or the student record may hold a stale year. The transcript decides the year group, the year band and the subjects. Use record_year_group only if the call never mentions the student's year, age or stage.",
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
            content: `BOOKING CONTEXT (contact details authoritative; booked subject and year group are reference only — the transcript wins for year group and subjects):\n${JSON.stringify(context, null, 2)}\n\nTRANSCRIPT:\n${text}`,
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

    // The transcript wins for year group; the booking record is only a fallback
    const transcriptYearGroup = draft.fields?.year_group?.value ?? null;
    const transcriptBand = draft.fields?.year_band?.value ?? bandFromYearGroup(transcriptYearGroup);

    if (!transcriptYearGroup && recordYearGroup) {
      draft.fields.year_group = {
        value: String(recordYearGroup),
        quote: null,
        timestamp: null,
        confidence: "medium",
      };
    }

    const yearsDisagree = Boolean(
      transcriptYearGroup && recordYearGroup &&
      String(transcriptYearGroup).replace(/\D/g, "") !== String(recordYearGroup).replace(/\D/g, "")
    );
    if (yearsDisagree && draft.fields?.year_group) {
      draft.fields.year_group.confidence = "medium";
    }

    const resolvedBand = transcriptBand ?? recordBand ?? bandFromYearGroup(draft.fields?.year_group?.value);
    draft.fields.year_band = {
      value: resolvedBand ?? null,
      quote: draft.fields?.year_band?.quote ?? null,
      timestamp: draft.fields?.year_band?.timestamp ?? null,
      confidence: resolvedBand
        ? (transcriptBand ? (yearsDisagree ? "medium" : (draft.fields?.year_band?.confidence ?? "medium")) : "medium")
        : "missing",
    };

    // Collapse the per-subject list into the single subjects field the UI edits
    const subjectList = Array.isArray(draft.fields?.subject_list) ? draft.fields.subject_list : [];
    const uniqueSubjects: any[] = [];
    for (const s of subjectList) {
      const v = String(s?.value ?? "").trim();
      if (!v) continue;
      if (uniqueSubjects.some((u) => u.value.toLowerCase() === v.toLowerCase())) continue;
      uniqueSubjects.push({
        value: v,
        quote: s?.quote ?? null,
        timestamp: s?.timestamp ?? null,
        confidence: isCanonicalSubject(v) ? (s?.confidence ?? "medium") : "low",
      });
    }
    draft.fields.subject_list = uniqueSubjects;

    if (uniqueSubjects.length > 0) {
      const anyLow = uniqueSubjects.some((s) => s.confidence === "low");
      const first = uniqueSubjects[0];
      draft.fields.subjects = {
        value: uniqueSubjects.map((s) => s.value).join(", "),
        quote: first.quote ?? draft.fields?.subjects?.quote ?? null,
        timestamp: first.timestamp ?? draft.fields?.subjects?.timestamp ?? null,
        confidence: anyLow ? "low" : (draft.fields?.subjects?.confidence ?? "medium"),
      };
    } else if (draft.fields?.subjects?.value && !isCanonicalSubject(draft.fields.subjects.value)) {
      draft.fields.subjects.confidence = "low";
    }

    if (Array.isArray(draft.lesson_times)) {
      draft.lesson_times = draft.lesson_times.map((lt: any) =>
        isCanonicalSubject(lt?.subject) ? lt : { ...lt, confidence: "low" }
      );
    }

    // Surface a trial-booking vs call conflict for the admin
    const bookedBandLabel = String(lesson.subject ?? "");
    if (!Array.isArray(draft.notes)) draft.notes = [];
    if (yearsDisagree) {
      draft.notes.unshift({
        kind: "conflict",
        text: `Booking record says ${recordYearGroup} but the call places the student in ${transcriptYearGroup}. The call was used for the year band and subject names.`,
        timestamp: draft.fields?.year_group?.timestamp ?? null,
      });
    }
    if (bookedBandLabel && recordBand && resolvedBand && recordBand !== resolvedBand) {
      draft.notes.unshift({
        kind: "conflict",
        text: `Trial was booked as "${bookedBandLabel}" (${recordBand}) but the call places the student in ${resolvedBand}. Subjects were rebanded from the transcript.`,
        timestamp: null,
      });
    }

    // Price sanity: the chosen price must appear among the candidates the model listed
    const priceField = draft.fields?.price_per_lesson;
    if (priceField) {
      const num = (v: unknown) => {
        const m = String(v ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
      };
      const candidates = Array.isArray(priceField.candidates) ? priceField.candidates : [];
      priceField.candidates = candidates;
      const chosen = num(priceField.value);
      if (chosen !== null && candidates.length > 0) {
        const listed = candidates.some((c: any) => num(c?.value) === chosen);
        if (!listed) priceField.confidence = "low";
      }
      if (candidates.length > 1 && priceField.confidence === "high") {
        const parentConfirmed = /\b(yes|okay|ok|that works|sounds good|perfect|happy with)\b/i.test(
          String(priceField.quote ?? ""),
        );
        if (!parentConfirmed) priceField.confidence = "medium";
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
