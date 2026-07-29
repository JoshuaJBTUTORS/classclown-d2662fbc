import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, MessageSquare, Sparkles, Menu, Trash2, Loader2, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownMessage: React.FC<{ children: string }> = ({ children }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ node, ...p }) => <h1 className="text-lg font-semibold mt-4 mb-2" {...p} />,
      h2: ({ node, ...p }) => <h2 className="text-base font-semibold mt-4 mb-2" {...p} />,
      h3: ({ node, ...p }) => <h3 className="text-base font-semibold mt-3 mb-1.5" {...p} />,
      h4: ({ node, ...p }) => <h4 className="text-sm font-semibold mt-3 mb-1" {...p} />,
      p: ({ node, ...p }) => <p className="my-2 leading-relaxed" {...p} />,
      ul: ({ node, ...p }) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
      ol: ({ node, ...p }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
      li: ({ node, ...p }) => <li className="leading-relaxed" {...p} />,
      strong: ({ node, ...p }) => <strong className="font-semibold text-white" {...p} />,
      em: ({ node, ...p }) => <em className="italic" {...p} />,
      a: ({ node, ...p }) => <a className="text-teal-400 underline hover:text-teal-300" target="_blank" rel="noreferrer" {...p} />,
      code: ({ node, className, children, ...p }: any) => {
        const inline = !className;
        return inline
          ? <code className="bg-white/10 rounded px-1 py-0.5 text-[0.85em]" {...p}>{children}</code>
          : <code className={className} {...p}>{children}</code>;
      },
      pre: ({ node, ...p }) => <pre className="bg-black/40 rounded-lg p-3 my-2 overflow-x-auto text-sm" {...p} />,
      blockquote: ({ node, ...p }) => <blockquote className="border-l-2 border-white/20 pl-3 my-2 text-[#c5c5d2]" {...p} />,
      hr: () => <hr className="my-4 border-white/10" />,
      table: ({ node, ...p }) => <div className="my-2 overflow-x-auto"><table className="min-w-full text-sm border-collapse" {...p} /></div>,
      th: ({ node, ...p }) => <th className="border border-white/15 px-2 py-1 text-left font-semibold" {...p} />,
      td: ({ node, ...p }) => <td className="border border-white/15 px-2 py-1" {...p} />,
    }}
  >
    {children}
  </ReactMarkdown>
);


export interface LessonProposal {
  title: string;
  subject: string;
  description: string | null;
  tutor_id: string;
  tutor_name: string;
  student_ids: number[];
  student_names: string[];
  start_time: string;
  end_time: string;
  is_group: boolean;
  recurring: { interval: string; occurrences: number } | null;
}

type ProposalState = 'pending' | 'confirming' | 'created' | 'cancelled' | 'error';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolStatus?: string | null;
  proposal?: LessonProposal | null;
  proposalState?: ProposalState;
  proposalMessage?: string | null;
}

const SUGGESTIONS = [
  { title: 'Summarise this week', subtitle: 'lessons, attendance and homework' },
  { title: 'Find at-risk students', subtitle: 'low engagement or missed lessons' },
  { title: 'How many trial lessons this month?', subtitle: 'booked, attended, no-shows' },
  { title: 'Which proposals are pending?', subtitle: 'sent but not yet signed' },
];

const TOOL_LABELS: Record<string, string> = {
  list_schema: 'Reading schema…',
  describe_table: 'Inspecting table…',
  sample_rows: 'Sampling rows…',
  run_sql: 'Running query…',
  propose_lesson: 'Preparing lesson…',
};

const fmtLondon = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
  });

const LessonProposalCard: React.FC<{
  proposal: LessonProposal;
  state: ProposalState;
  message?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ proposal, state, message, onConfirm, onCancel }) => {
  const locked = state !== 'pending' && state !== 'error';
  const mins = Math.round(
    (new Date(proposal.end_time).getTime() - new Date(proposal.start_time).getTime()) / 60000,
  );

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-[#2a2a2a] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <CalendarPlus className="w-4 h-4 text-teal-400" />
        <span className="font-medium text-sm">Create lesson — needs your approval</span>
      </div>

      <dl className="px-4 py-3 text-sm space-y-2">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Title</dt>
          <dd className="font-medium">{proposal.title}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Subject</dt>
          <dd>{proposal.subject}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Tutor</dt>
          <dd>{proposal.tutor_name}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Student{proposal.student_names.length > 1 ? 's' : ''}</dt>
          <dd>{proposal.student_names.join(', ')}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">When</dt>
          <dd>
            {fmtLondon(proposal.start_time)} – {fmtTime(proposal.end_time)}{' '}
            <span className="text-[#8e8ea0]">({mins} min, UK time)</span>
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Type</dt>
          <dd>{proposal.is_group ? 'Group lesson' : '1-1 lesson'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#8e8ea0]">Repeats</dt>
          <dd>
            {proposal.recurring
              ? `${proposal.recurring.interval} × ${proposal.recurring.occurrences} occurrences`
              : 'One-off'}
          </dd>
        </div>
        {proposal.description && (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-[#8e8ea0]">Notes</dt>
            <dd className="text-[#c5c5d2]">{proposal.description}</dd>
          </div>
        )}
      </dl>

      {message && (
        <div
          className={`px-4 pb-3 text-sm ${state === 'created' ? 'text-emerald-400' : state === 'error' ? 'text-red-400' : 'text-[#8e8ea0]'}`}
        >
          {message}
        </div>
      )}

      {!locked && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-medium transition-colors"
          >
            Confirm and create
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/15 hover:bg-white/5 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'confirming' && (
        <div className="px-4 pb-4 inline-flex items-center gap-2 text-xs text-[#8e8ea0]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Creating…
        </div>
      )}
    </div>
  );
};

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-cleo`;
const CREATE_LESSON_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-cleo-create-lesson`;

const AgentCleo: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const autoresize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Msg = { id: assistantId, role: 'assistant', content: '', toolStatus: null };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);
    requestAnimationFrame(autoresize);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const resp = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text();
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          let ev: any;
          try { ev = JSON.parse(data); } catch { continue; }

          if (ev.type === 'text') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + ev.delta, toolStatus: null } : m,
            ));
          } else if (ev.type === 'tool') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, toolStatus: TOOL_LABELS[ev.name] ?? `Using ${ev.name}…` } : m,
            ));
          } else if (ev.type === 'proposal') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId
                ? { ...m, proposal: ev.proposal as LessonProposal, proposalState: 'pending', proposalMessage: null, toolStatus: null }
                : m,
            ));
          } else if (ev.type === 'tool_error') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId
                ? { ...m, toolStatus: `⚠ ${ev.tool ?? 'Tool'} hit an error — trying a different way…` }
                : m,
            ));
          } else if (ev.type === 'error') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, content: `⚠️ ${ev.error}`, toolStatus: null } : m,
            ));
          } else if (ev.type === 'done') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, toolStatus: null } : m,
            ));
          }
        }
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, content: `⚠️ ${(e as Error).message}`, toolStatus: null } : m,
      ));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const setProposalState = (msgId: string, state: ProposalState, message?: string | null) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, proposalState: state, proposalMessage: message ?? null } : m,
    ));
  };

  const confirmProposal = async (msg: Msg) => {
    if (!msg.proposal) return;
    setProposalState(msg.id, 'confirming', null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const resp = await fetch(CREATE_LESSON_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proposal: msg.proposal }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.error) throw new Error(result?.error || `HTTP ${resp.status}`);

      const count = result.created_count ?? 1;
      setProposalState(
        msg.id,
        'created',
        count > 1
          ? `Created — ${count} lessons added to the calendar.`
          : 'Created — the lesson is on the calendar.',
      );
    } catch (e) {
      setProposalState(msg.id, 'error', `Could not create: ${(e as Error).message}`);
    }
  };

  const cancelProposal = (msg: Msg) => {
    setProposalState(msg.id, 'cancelled', 'Cancelled — nothing was created.');
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex bg-[#212121] text-[#ececec] antialiased">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} shrink-0 overflow-hidden bg-[#171717] transition-all duration-200 ease-out flex flex-col`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close sidebar">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={newChat} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="New chat">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-2">
          <button onClick={newChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors">
            <Sparkles className="w-4 h-4" />
            New chat
          </button>
        </div>

        <div className="px-3 mt-6 mb-2 text-xs font-medium text-[#8e8ea0] uppercase tracking-wider">Recent</div>
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
          {['Weekly overview', 'Trial follow-ups', 'Tutor payroll July'].map((label) => (
            <div key={label} className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">
              <MessageSquare className="w-4 h-4 text-[#8e8ea0] shrink-0" />
              <span className="text-sm truncate flex-1">{label}</span>
              <Trash2 className="w-3.5 h-3.5 text-[#8e8ea0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-xs font-semibold">C</div>
            <div className="text-sm font-medium">Agent Cleo</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-3 h-14 shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Open sidebar">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 cursor-default">
            <span className="font-semibold">Agent Cleo</span>
            <span className="text-[#8e8ea0] text-sm">CRM · read-only</span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/40 text-2xl font-semibold">C</div>
              <h1 className="text-3xl font-semibold mb-2">How can I help today?</h1>
              <p className="text-[#8e8ea0] mb-10">Ask me anything about the CRM.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button key={s.title} onClick={() => { setInput(s.title); textareaRef.current?.focus(); }} className="text-left p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
                    <div className="font-medium mb-0.5">{s.title}</div>
                    <div className="text-sm text-[#8e8ea0]">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-[#2f2f2f] rounded-3xl px-5 py-3 whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 text-sm font-semibold">C</div>
                    <div className="flex-1 pt-1 leading-relaxed">
                      {m.content && <MarkdownMessage>{m.content}</MarkdownMessage>}
                      {m.proposal && (
                        <LessonProposalCard
                          proposal={m.proposal}
                          state={m.proposalState ?? 'pending'}
                          message={m.proposalMessage}
                          onConfirm={() => confirmProposal(m)}
                          onCancel={() => cancelProposal(m)}
                        />
                      )}
                      {m.toolStatus && (

                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#8e8ea0] bg-white/5 rounded-full px-3 py-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {m.toolStatus}
                        </div>
                      )}
                      {!m.content && !m.toolStatus && loading && (
                        <div className="inline-flex items-center gap-2 text-xs text-[#8e8ea0]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Thinking…
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-[#2f2f2f] rounded-3xl border border-white/5 shadow-lg">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoresize(); }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message Agent Cleo"
                className="flex-1 bg-transparent resize-none px-5 py-4 pr-14 outline-none placeholder:text-[#8e8ea0] max-h-[220px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:bg-white/20 disabled:text-white/40 transition-colors"
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-xs text-[#8e8ea0] mt-2">Agent Cleo has read-only access to the CRM database.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCleo;
