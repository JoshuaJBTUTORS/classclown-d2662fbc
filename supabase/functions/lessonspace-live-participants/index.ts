// Returns live participant state for lessons that are currently scheduled,
// polled directly from the LessonSpace API (webhooks only cover spaces
// launched after the webhook subscription was added).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LESSONSPACE_API_KEY_HASHED") ?? Deno.env.get("LESSONSPACE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_lessonspace_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let debugRoom: string | null = null;
    try {
      const body = await req.json();
      debugRoom = body?.debugRoom ?? null;
    } catch { /* no body */ }

    if (debugRoom) {
      const res = await fetch(`https://api.thelessonspace.com/v2/spaces/${debugRoom}/sessions/`, {
        headers: { Authorization: `Organisation ${apiKey}` },
      });
      const text = await res.text();
      return new Response(JSON.stringify({ status: res.status, body: text.slice(0, 4000) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("id, title, start_time, end_time, lesson_space_room_id, subject")
      .lte("start_time", new Date(Date.now() + 10 * 60 * 1000).toISOString())
      .gte("end_time", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .not("lesson_space_room_id", "is", null);

    if (error) throw error;

    const results = await Promise.all(
      (lessons ?? []).map(async (lesson: any) => {
        try {
          const res = await fetch(
            `https://api.thelessonspace.com/v2/spaces/${lesson.lesson_space_room_id}/sessions/`,
            { headers: { Authorization: `Organisation ${apiKey}` } },
          );
          if (!res.ok) {
            return { ...lesson, participants: [], error: `lessonspace_${res.status}` };
          }
          const json = await res.json();
          const sessions: any[] = Array.isArray(json) ? json : (json?.results ?? []);
          // Active session = no end_time
          const active = sessions.find((s) => !s?.end_time) ?? null;
          const profiles: any[] = active?.profiles ?? [];
          const connected: any[] = active?.connected_users ?? [];
          const logs: any[] = active?.logs ?? [];

          const connectedProfileIds = Array.from(
            new Set(connected.map((c) => c?.profile).filter((p) => p != null)),
          );

          const participants = connectedProfileIds.map((pid) => {
            const profile = profiles.find((p) => p?.user === pid);
            const joins = logs
              .filter((l) => l?.profile === pid && l?.log_type === "user-joined")
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const firstJoin = joins[0];
            const lastJoin = joins[joins.length - 1];
            return {
              id: String(pid),
              name: profile?.name ?? "Unknown",
              role: profile?.role ?? null,
              isLeader: profile?.role === "teacher",
              joinedAt: firstJoin?.date ?? active?.start_time ?? null,
              lastJoinedAt: lastJoin?.date ?? null,
              rejoinCount: Math.max(0, joins.length - 1),
            };
          });

          const guests = (active?.guests ?? []).map((g: any, i: number) => ({
            id: `guest-${i}`,
            name: g?.name ?? "Guest",
            role: "guest",
            isLeader: false,
            joinedAt: null,
          }));

          return {
            ...lesson,
            sessionId: active?.uuid ?? null,
            sessionStart: active?.start_time ?? null,
            sessionActive: Boolean(active),
            participants: [...participants, ...guests],
          };

        } catch (e) {
          return { ...lesson, participants: [], error: (e as Error).message };
        }
      }),
    );

    return new Response(JSON.stringify({ generatedAt: nowIso, lessons: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
