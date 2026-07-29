// Agent Cleo — read-only CRM analyst backed by OpenAI (direct, not Lovable Gateway).
// Tools are backed by the guarded public.agent_cleo_exec RPC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `You are Agent Cleo, a read-only analyst for the Class Beyond CRM (a tutoring business).

You have full read-only access to the Postgres database via tools. You cannot write, update, or delete anything — attempts will error at the database level.

WORKFLOW:
1. When asked something, first call \`list_schema\` to see what tables exist.
2. Call \`describe_table\` on the tables that look relevant to understand their columns and foreign keys.
3. Optionally call \`sample_rows\` to see actual values / string formats.
4. Then compose SELECT queries with \`run_sql\` to answer the question.

RULES:
- Never claim to have changed data — you can't.
- Do not call database functions directly. Read tables and views only.
- Prefer joining across tables over multiple round-trips.
- Use LIMIT sensibly. Results are capped at 500 rows regardless.
- All lesson times are stored in UTC; the business timezone is Europe/London.
- Be concise and factual in your final answer. Show numbers, dates, and names directly.`;

const tools = [
  {
    type: "function",
    function: {
      name: "list_schema",
      description: "List every table and view in the public schema with an estimated row count. Use this first to see what's available.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "describe_table",
      description: "Return the columns (name, type, nullable), primary key, and foreign keys of a table in the public schema.",
      parameters: {
        type: "object",
        properties: { table: { type: "string", description: "Table name in public schema" } },
        required: ["table"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sample_rows",
      description: "Return up to N rows from a public table so you can see the shape of the data.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["table"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_sql",
      description: "Run an arbitrary read-only SQL query (SELECT / WITH only). Results are capped at 500 rows.",
      parameters: {
        type: "object",
        properties: { sql: { type: "string", description: "A single SELECT or WITH statement" } },
        required: ["sql"],
        additionalProperties: false,
      },
    },
  },
];

async function execSql(sql: string): Promise<unknown> {
  const normalizedSql = sql
    .trim()
    .replace(/\s+/g, " ")
    .replace(/;\s*$/, "");

  const { data, error } = await service.rpc("agent_cleo_exec", { sql: normalizedSql });
  if (error) throw new Error(error.message);
  return data;
}

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    if (name === "list_schema") {
      const rows = await execSql(`
        SELECT table_name AS name,
               CASE table_type
                 WHEN 'BASE TABLE' THEN 'table'
                 WHEN 'VIEW' THEN 'view'
                 ELSE lower(table_type)
               END AS kind
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_name
      `);
      return JSON.stringify({ ok: true, rows });
    }
    if (name === "describe_table") {
      const table = String(args.table).replace(/[^a-zA-Z0-9_]/g, "");
      const cols = await execSql(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}'
        ORDER BY ordinal_position
      `);
      const fks = await execSql(`
        SELECT kcu.column_name, ccu.table_name AS references_table, ccu.column_name AS references_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public' AND tc.table_name = '${table}'
      `);
      const pk = await execSql(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public' AND tc.table_name = '${table}'
      `);
      return JSON.stringify({ ok: true, columns: cols, primary_key: pk, foreign_keys: fks });
    }
    if (name === "sample_rows") {
      const table = String(args.table).replace(/[^a-zA-Z0-9_]/g, "");
      const limit = Math.min(Number(args.limit ?? 5), 20);
      const rows = await execSql(`SELECT * FROM public."${table}" LIMIT ${limit}`);
      return JSON.stringify({ ok: true, rows });
    }
    if (name === "run_sql") {
      let sql = String(args.sql).trim().replace(/;+\s*$/, "");
      if (!/\blimit\s+\d+/i.test(sql)) sql = `SELECT * FROM (${sql}) _sub LIMIT 500`;
      const rows = await execSql(sql);
      return JSON.stringify({ ok: true, rows });
    }
    return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  } catch (e) {
    const message = (e as Error).message;
    console.error(`Agent Cleo tool failed: ${name}`, { args, error: message });
    return JSON.stringify({ ok: false, tool: name, error: message });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: verify JWT + role
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing Authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);

    const { data: roles } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const allowed = (roles ?? []).some((r) => r.role === "admin" || r.role === "owner");
    if (!allowed) return json({ error: "Forbidden — admin/owner only" }, 403);

    const body = await req.json();
    const userMessages = body.messages ?? [];

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages,
    ];

    // Streaming SSE response back to the browser
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          for (let step = 0; step < 20; step++) {
            const resp = await fetch(OPENAI_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: MODEL,
                messages,
                tools,
                stream: true,
                reasoning_effort: "none",
              }),
            });

            if (!resp.ok || !resp.body) {
              const errText = await resp.text();
              send({ type: "error", error: `OpenAI ${resp.status}: ${errText}` });
              controller.close();
              return;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let assistantText = "";
            const toolCalls: Record<number, { id?: string; name?: string; args: string }> = {};
            let finishReason: string | null = null;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                let parsed: any;
                try { parsed = JSON.parse(data); } catch { continue; }
                const choice = parsed.choices?.[0];
                if (!choice) continue;
                const delta = choice.delta ?? {};
                if (delta.content) {
                  assistantText += delta.content;
                  send({ type: "text", delta: delta.content });
                }
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCalls[idx]) toolCalls[idx] = { args: "" };
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
                  }
                }
                if (choice.finish_reason) finishReason = choice.finish_reason;
              }
            }

            const calls = Object.entries(toolCalls).sort(([a], [b]) => Number(a) - Number(b));
            if (calls.length === 0) {
              send({ type: "done" });
              controller.close();
              return;
            }

            // Push assistant message with the tool calls
            messages.push({
              role: "assistant",
              content: assistantText || null,
              tool_calls: calls.map(([, c]) => ({
                id: c.id,
                type: "function",
                function: { name: c.name, arguments: c.args || "{}" },
              })),
            });

            // Execute tool calls, stream status chips, push results
            for (const [, call] of calls) {
              send({ type: "tool", name: call.name });
              let parsedArgs: Record<string, unknown> = {};
              try { parsedArgs = JSON.parse(call.args || "{}"); } catch {}
              const result = await runTool(call.name!, parsedArgs);
              try {
                const parsedResult = JSON.parse(result);
                if (parsedResult?.ok === false) {
                  send({ type: "error", error: `${call.name} failed: ${parsedResult.error}` });
                  controller.close();
                  return;
                }
              } catch {
                // Tool output is still forwarded to the model below.
              }
              messages.push({
                role: "tool",
                tool_call_id: call.id!,
                content: result.length > 60000 ? result.slice(0, 60000) + "…[truncated]" : result,
              });
            }

            if (finishReason && finishReason !== "tool_calls") {
              send({ type: "done" });
              controller.close();
              return;
            }
          }
          send({ type: "error", error: "Max tool steps reached" });
          controller.close();
        } catch (e) {
          send({ type: "error", error: (e as Error).message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
