import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, Plus, MessageSquare, Menu, Trash2, Loader2, CalendarPlus, CalendarCog, Mic, Square, X, LayoutGrid, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AudioRecorder } from '@/utils/audioRecorder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  updateSingleRecurringInstance,
  updateAllFutureLessons,
} from '@/services/recurringLessonEditService';
import { useAgentCleoThreads } from '@/hooks/useAgentCleoThreads';
import { AgentCleoThreadList } from '@/components/agentCleo/AgentCleoThreadList';
import DailySnapshot from '@/components/agentCleo/DailySnapshot';

const Typewriter: React.FC<{ text: string; speed?: number; className?: string }> = ({ text, speed = 90, className }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text) return;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span className={className}>
      {text.slice(0, count)}
      {count < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
};

const UserAvatar: React.FC<{ avatarUrl?: string | null; name?: string | null; className?: string }> = ({ avatarUrl, name, className }) => {
  const [errored, setErrored] = useState(false);
  const initial = (name?.trim()?.[0] || 'Y').toUpperCase();
  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `${name}'s profile picture` : 'Your profile picture'}
        onError={() => setErrored(true)}
        className={className}
      />
    );
  }
  return <div className={className}>{initial}</div>;
};




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
      strong: ({ node, ...p }) => <strong className="font-semibold text-[#1a1a1a] dark:text-white" {...p} />,
      em: ({ node, ...p }) => <em className="italic" {...p} />,
      a: ({ node, ...p }) => <a className="text-teal-600 underline hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300" target="_blank" rel="noreferrer" {...p} />,
      code: ({ node, className, children, ...p }: any) => {
        const inline = !className;
        return inline
          ? <code className="bg-black/5 dark:bg-white/10 rounded px-1 py-0.5 text-[0.85em]" {...p}>{children}</code>
          : <code className={className} {...p}>{children}</code>;
      },
      pre: ({ node, ...p }) => <pre className="bg-[#efe9dc] dark:bg-black/40 rounded-lg p-3 my-2 overflow-x-auto text-sm" {...p} />,
      blockquote: ({ node, ...p }) => <blockquote className="border-l-2 border-black/15 dark:border-white/20 pl-3 my-2 text-[#55555e] dark:text-[#c5c5d2]" {...p} />,
      hr: () => <hr className="my-4 border-black/10 dark:border-white/10" />,
      table: ({ node, ...p }) => <div className="my-2 overflow-x-auto"><table className="min-w-full text-sm border-collapse" {...p} /></div>,
      th: ({ node, ...p }) => <th className="border border-black/15 dark:border-white/15 px-2 py-1 text-left font-semibold" {...p} />,
      td: ({ node, ...p }) => <td className="border border-black/15 dark:border-white/15 px-2 py-1" {...p} />,
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
  warnings?: string[];
}

export interface LessonEditChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface LessonEditProposal {
  lesson_id: string;
  lesson_title: string;
  lesson_start_time: string;
  is_recurring: boolean;
  scope: 'this_lesson_only' | 'all_future_lessons';
  affected_count: number;
  changes: LessonEditChange[];
  updates: {
    title?: string;
    description?: string;
    subject?: string;
    tutor_id?: string;
    start_time?: string;
    end_time?: string;
    is_group?: boolean;
    student_ids?: number[];
  };
  side_effects: string[];
  warnings?: string[];
}

type ProposalState = 'pending' | 'confirming' | 'created' | 'cancelled' | 'error';

interface ProposalEntry {
  id: string;
  kind: 'create' | 'edit';
  data: LessonProposal | LessonEditProposal;
  state: ProposalState;
  message?: string | null;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolStatus?: string | null;
  proposals?: ProposalEntry[];
  batchMessage?: string | null;
}


const SUGGESTIONS = [
  { title: 'Summarise this week', subtitle: 'lessons, attendance and homework' },
  { title: 'Find at-risk students', subtitle: 'low engagement or missed lessons' },
  { title: 'How many trial lessons this month?', subtitle: 'booked, attended, no-shows' },
  { title: 'Which proposals are pending?', subtitle: 'sent but not yet signed' },
];

const DAILY_QUOTES = [
  'Small steps every day add up to big results.',
  'Every lesson you plan changes someone’s trajectory.',
  'Progress, not perfection — you’re doing great.',
  'The best time to help a student is today.',
  'Great teaching starts with great organisation. You’ve got this.',
  'One calm, clear day at a time.',
  'Your work today becomes someone’s breakthrough tomorrow.',
  'Consistency is quiet, but it wins.',
  'A well-run day is a gift to every family you support.',
  'Keep going — the details you handle matter more than you know.',
  'Today is a good day to make a difference.',
  'Clarity beats chaos. You’re building clarity.',
  'Every family you onboard is a new story beginning.',
  'Done is better than perfect — keep the momentum.',
];

// Deterministic daily pick — rotates once per day, no backend needed.
const quoteOfTheDay = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const TOOL_LABELS: Record<string, string> = {
  list_schema: 'Reading schema…',
  describe_table: 'Inspecting table…',
  sample_rows: 'Sampling rows…',
  run_sql: 'Running query…',
  propose_lesson: 'Preparing lesson…',
  propose_lesson_edit: 'Preparing lesson changes…',
  open_page: 'Opening page…',

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
    <div className="mt-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2a2a2a] overflow-hidden">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
        <CalendarPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="font-medium text-sm">Create lesson — needs your approval</span>
      </div>

      <dl className="px-4 py-3 text-sm space-y-2">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Title</dt>
          <dd className="font-medium">{proposal.title}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Subject</dt>
          <dd>{proposal.subject}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Tutor</dt>
          <dd>{proposal.tutor_name}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Student{proposal.student_names.length > 1 ? 's' : ''}</dt>
          <dd>{proposal.student_names.join(', ')}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">When</dt>
          <dd>
            {fmtLondon(proposal.start_time)} – {fmtTime(proposal.end_time)}{' '}
            <span className="text-[#6b6b76] dark:text-[#8e8ea0]">({mins} min, UK time)</span>
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Type</dt>
          <dd>{proposal.is_group ? 'Group lesson' : '1-1 lesson'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Repeats</dt>
          <dd>
            {proposal.recurring
              ? `${proposal.recurring.interval} × ${proposal.recurring.occurrences} occurrences`
              : 'One-off'}
          </dd>
        </div>
        {proposal.description && (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Notes</dt>
            <dd className="text-[#55555e] dark:text-[#c5c5d2]">{proposal.description}</dd>
          </div>
        )}
      </dl>

      {proposal.warnings && proposal.warnings.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Tutor availability check</div>
          <ul className="list-disc pl-4 text-xs text-amber-800/90 dark:text-amber-200/90 space-y-1">
            {proposal.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <div
          className={`px-4 pb-3 text-sm ${state === 'created' ? 'text-emerald-600 dark:text-emerald-400' : state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-[#6b6b76] dark:text-[#8e8ea0]'}`}
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
            className="px-4 py-2 rounded-xl border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'confirming' && (
        <div className="px-4 pb-4 inline-flex items-center gap-2 text-xs text-[#6b6b76] dark:text-[#8e8ea0]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Creating…
        </div>
      )}
    </div>
  );
};

const fmtRange = (value: string) => {
  const [start, end] = value.split('|');
  if (!start) return '—';
  return end ? `${fmtLondon(start)} – ${fmtTime(end)}` : fmtLondon(start);
};

const LessonEditProposalCard: React.FC<{
  proposal: LessonEditProposal;
  state: ProposalState;
  message?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ proposal, state, message, onConfirm, onCancel }) => {
  const locked = state !== 'pending' && state !== 'error';

  return (
    <div className="mt-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2a2a2a] overflow-hidden">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
        <CalendarCog className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <span className="font-medium text-sm">Edit lesson — needs your approval</span>
      </div>

      <div className="px-4 py-3 text-sm space-y-3">
        <div className="text-[#55555e] dark:text-[#c5c5d2]">
          <span className="font-medium text-[#1a1a1a] dark:text-white">{proposal.lesson_title || 'Lesson'}</span>{' '}
          <span className="text-[#6b6b76] dark:text-[#8e8ea0]">· {fmtLondon(proposal.lesson_start_time)}</span>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
          {proposal.changes.map((c) => (
            <div key={c.field} className="px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-[#6b6b76] dark:text-[#8e8ea0] mb-1">{c.label}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="line-through text-[#6b6b76] dark:text-[#8e8ea0]">
                  {c.field === 'time' ? fmtRange(c.before) : c.before}
                </span>
                <span className="text-[#6b6b76] dark:text-[#8e8ea0]">→</span>
                <span className="font-medium text-[#1a1a1a] dark:text-white">
                  {c.field === 'time' ? fmtRange(c.after) : c.after}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <span className="w-28 shrink-0 text-[#6b6b76] dark:text-[#8e8ea0]">Applies to</span>
          <span>
            {proposal.scope === 'all_future_lessons'
              ? `This and all future occurrences (${proposal.affected_count} lesson${proposal.affected_count === 1 ? '' : 's'})`
              : 'This lesson only'}
          </span>
        </div>

        {proposal.side_effects.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-amber-700/90 dark:text-amber-300/90 space-y-1">
            {proposal.side_effects.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}

        {proposal.warnings && proposal.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Tutor availability check</div>
            <ul className="list-disc pl-4 text-xs text-amber-800/90 dark:text-amber-200/90 space-y-1">
              {proposal.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`px-4 pb-3 text-sm ${state === 'created' ? 'text-emerald-600 dark:text-emerald-400' : state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-[#6b6b76] dark:text-[#8e8ea0]'}`}
        >
          {message}
        </div>
      )}

      {!locked && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition-colors"
          >
            Confirm and apply
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'confirming' && (
        <div className="px-4 pb-4 inline-flex items-center gap-2 text-xs text-[#6b6b76] dark:text-[#8e8ea0]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Applying…
        </div>
      )}
    </div>
  );
};



const FUNCTIONS_BASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://sjxbxkpegcnnfjbsxazo.supabase.co'
).replace(/\/+$/, '');
const FUNCTION_URL = `${FUNCTIONS_BASE_URL}/functions/v1/agent-cleo`;
const CREATE_LESSON_URL = `${FUNCTIONS_BASE_URL}/functions/v1/agent-cleo-create-lesson`;

const AgentCleo: React.FC = () => {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    threads, loadingThreads, loadMessages, createThread, saveMessage, renameThread, deleteThread,
  } = useAgentCleoThreads();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('agent-cleo-theme') === 'dark'; } catch { return false; }
  });
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try { localStorage.setItem('agent-cleo-theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
      return next;
    });
  };
  const firstName = profile?.first_name?.trim() || null;
  const quote = quoteOfTheDay();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks the thread the current send belongs to, so a thread created mid-send is persisted to.
  const activeThreadRef = useRef<string | null>(threadId ?? null);
  // Thread just created by this page's own send — its URL change must not trigger a DB restore.
  const justCreatedThreadRef = useRef<string | null>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Restore the conversation whenever the route thread changes (including on reload).
  useEffect(() => {
    let cancelled = false;
    activeThreadRef.current = threadId ?? null;
    if (threadId && justCreatedThreadRef.current === threadId) {
      // We just created this thread locally; keep the optimistic/streaming messages on screen.
      justCreatedThreadRef.current = null;
      return;
    }
    if (!threadId) {
      setMessages([]);
      return;
    }
    (async () => {
      const stored = await loadMessages(threadId);
      if (!cancelled) {
        setMessages(stored.map((m) => ({ id: m.id, role: m.role, content: m.content })));
      }
    })();
    return () => { cancelled = true; };
  }, [threadId, loadMessages]);



  const autoresize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  };

  // ---- Voice input (speech -> text in the composer) ----
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    recorderRef.current?.cancel();
  }, []);

  const clearDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    if (!AudioRecorder.isSupported()) {
      toast.error('Voice recording is not supported in your browser');
      return;
    }
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setRecordingState('recording');
      setRecordingDuration(0);
      durationIntervalRef.current = window.setInterval(() => {
        if (recorderRef.current) setRecordingDuration(recorderRef.current.getRecordingDuration());
      }, 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      toast.error(e instanceof Error ? e.message : 'Could not access your microphone');
      recorderRef.current = null;
      setRecordingState('idle');
    }
  };

  const cancelRecording = () => {
    clearDurationTimer();
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setRecordingState('idle');
    setRecordingDuration(0);
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recorderRef.current) return;
    try {
      setRecordingState('processing');
      clearDurationTimer();
      const blob = await recorderRef.current.stop();
      const base64Audio = await AudioRecorder.blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio },
      });
      if (error) throw error;
      const text: string = (data?.text || '').trim();
      if (!text) {
        toast.error('No speech detected. Please try again.');
        return;
      }
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        autoresize();
      });
    } catch (e) {
      console.error('Transcription error:', e);
      toast.error('Failed to transcribe audio. Please try again.');
    } finally {
      recorderRef.current = null;
      setRecordingState('idle');
      setRecordingDuration(0);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // First message in a fresh chat creates the saved thread (no empty ghost threads).
    let currentThread = activeThreadRef.current;
    if (!currentThread) {
      currentThread = await createThread(text);
      if (currentThread) {
        activeThreadRef.current = currentThread;
        justCreatedThreadRef.current = currentThread;
        navigate(`/agent-cleo/${currentThread}`, { replace: true });
      }
    }
    const userSavePromise = currentThread
      ? saveMessage(currentThread, 'user', text).catch((e) => console.error('Failed to save user message:', e))
      : Promise.resolve();

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Msg = { id: assistantId, role: 'assistant', content: '', toolStatus: null };
    let assistantText = '';
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

      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error(
          `Unexpected response from Agent Cleo (${contentType || 'unknown type'}). The function endpoint could not be reached.`,
        );
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
            assistantText += ev.delta;
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + ev.delta, toolStatus: null } : m,
            ));

          } else if (ev.type === 'tool') {
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, toolStatus: TOOL_LABELS[ev.name] ?? `Using ${ev.name}…` } : m,
            ));
          } else if (ev.type === 'proposal' || ev.type === 'edit_proposal') {
            const entry: ProposalEntry = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              kind: ev.type === 'proposal' ? 'create' : 'edit',
              data: ev.proposal,
              state: 'pending',
              message: null,
            };
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId
                ? { ...m, proposals: [...(m.proposals ?? []), entry], toolStatus: null }
                : m,
            ));
          } else if (ev.type === 'navigate') {
            const target = String(ev.path || '');
            if (target.startsWith('/')) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, toolStatus: null } : m,
              ));
              setTimeout(() => navigate(target), 400);
            }
          } else if (ev.type === 'tool_error') {

            setMessages((prev) => prev.map((m) =>
              m.id === assistantId
                ? { ...m, toolStatus: `⚠ ${ev.tool ?? 'Tool'} hit an error — trying a different way…` }
                : m,
            ));
          } else if (ev.type === 'error') {
            assistantText = `⚠️ ${ev.error}`;
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
      assistantText = `⚠️ ${(e as Error).message}`;
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, content: `⚠️ ${(e as Error).message}`, toolStatus: null } : m,
      ));
    } finally {
      if (currentThread && assistantText.trim()) {
        const threadForSave = currentThread;
        void userSavePromise.then(() =>
          saveMessage(threadForSave, 'assistant', assistantText).catch((e) =>
            console.error('Failed to save assistant message:', e),
          ),
        );
      }
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

  const setEntryState = (msgId: string, entryId: string, state: ProposalState, message?: string | null) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId
        ? {
            ...m,
            proposals: (m.proposals ?? []).map((p) =>
              p.id === entryId ? { ...p, state, message: message ?? null } : p,
            ),
          }
        : m,
    ));
  };

  const applyCreate = async (msgId: string, entry: ProposalEntry) => {
    const proposal = entry.data as LessonProposal;
    setEntryState(msgId, entry.id, 'confirming', null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const resp = await fetch(CREATE_LESSON_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proposal }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.error) throw new Error(result?.error || `HTTP ${resp.status}`);

      const count = result.created_count ?? 1;
      setEntryState(
        msgId,
        entry.id,
        'created',
        count > 1
          ? `Created — ${count} lessons added to the calendar.`
          : 'Created — the lesson is on the calendar.',
      );
      return true;
    } catch (e) {
      setEntryState(msgId, entry.id, 'error', `Could not create: ${(e as Error).message}`);
      return false;
    }
  };

  // Applies the approved edit through the exact same service the calendar edit form uses,
  // so LessonSpace rooms, participant links and enrollment notifications behave identically.
  const applyEdit = async (msgId: string, entry: ProposalEntry) => {
    const p = entry.data as LessonEditProposal;
    setEntryState(msgId, entry.id, 'confirming', null);
    try {
      const { student_ids, ...lessonFields } = p.updates;
      const updateData = {
        ...lessonFields,
        ...(student_ids ? { selectedStudents: student_ids } : {}),
      };

      if (p.scope === 'all_future_lessons') {
        const updated = await updateAllFutureLessons(p.lesson_id, updateData, p.lesson_start_time);
        setEntryState(msgId, entry.id, 'created', `Applied — ${updated} lesson${updated === 1 ? '' : 's'} updated.`);
      } else {
        await updateSingleRecurringInstance(p.lesson_id, updateData);
        setEntryState(msgId, entry.id, 'created', 'Applied — the lesson has been updated.');
      }
      return true;
    } catch (e) {
      setEntryState(msgId, entry.id, 'error', `Could not apply: ${(e as Error).message}`);
      return false;
    }
  };

  const confirmEntry = (msg: Msg, entry: ProposalEntry) =>
    entry.kind === 'create' ? applyCreate(msg.id, entry) : applyEdit(msg.id, entry);

  const cancelEntry = (msg: Msg, entry: ProposalEntry) => {
    setEntryState(msg.id, entry.id, 'cancelled', 'Cancelled — nothing was changed.');
  };

  const setBatchMessage = (msgId: string, message: string | null) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, batchMessage: message } : m)));
  };

  // Sequential on purpose: parallel writes could race on the same recurring series.
  const confirmAll = async (msg: Msg) => {
    const pending = (msg.proposals ?? []).filter((p) => p.state === 'pending' || p.state === 'error');
    if (!pending.length) return;
    setBatchMessage(msg.id, `Applying ${pending.length} proposals…`);
    let ok = 0;
    let failed = 0;
    for (const entry of pending) {
      const success = await confirmEntry(msg, entry);
      if (success) ok++; else failed++;
    }
    setBatchMessage(msg.id, failed ? `${ok} applied, ${failed} failed.` : `${ok} applied.`);
  };

  const cancelAll = (msg: Msg) => {
    const pending = (msg.proposals ?? []).filter((p) => p.state === 'pending' || p.state === 'error');
    pending.forEach((entry) => cancelEntry(msg, entry));
    setBatchMessage(msg.id, 'Cancelled — nothing was changed.');
  };




  const newChat = () => {
    activeThreadRef.current = null;
    setMessages([]);
    setInput('');
    navigate('/agent-cleo');
    textareaRef.current?.focus();
  };

  const handleSelectThread = (id: string) => {
    if (id === threadId) return;
    navigate(`/agent-cleo/${id}`);
  };

  const handleDeleteThread = async (id: string) => {
    await deleteThread(id);
    if (id === threadId) newChat();
  };


  const hasMessages = messages.length > 0;

  return (
    <div className={isDark ? 'dark' : ''}>
    <div className="fixed inset-0 z-50 flex bg-[#f6f2e9] text-[#2b2b2b] dark:bg-[#212121] dark:text-[#ececec] antialiased">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} shrink-0 overflow-hidden bg-white/70 dark:bg-[#171717] border-r border-black/5 dark:border-r-0 transition-all duration-200 ease-out flex flex-col`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="Close sidebar">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={newChat} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="New chat">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-2">
          <button onClick={newChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium transition-colors">
            <MessageSquare className="w-4 h-4" />
            New chat
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Open CRM
          </button>
        </div>

        <div className="px-3 mt-6 mb-2 text-xs font-medium text-[#6b6b76] dark:text-[#8e8ea0] uppercase tracking-wider">Recent</div>
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
          <AgentCleoThreadList
            threads={threads}
            activeId={threadId}
            loading={loadingThreads}
            onSelect={handleSelectThread}
            onRename={renameThread}
            onDelete={handleDeleteThread}
          />
        </nav>


        <div className="p-3 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-xs font-semibold text-white">C</div>
            <div className="text-sm font-medium">Agent Cleo</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-3 h-14 shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="Open sidebar">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-default">
            <span className="font-semibold">Agent Cleo</span>
            <span className="text-[#6b6b76] dark:text-[#8e8ea0] text-sm">CRM · read-only</span>
          </div>
          <button
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="min-h-full flex flex-col items-center justify-center px-4 py-10">
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={firstName}
                className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/40 text-2xl font-semibold text-white"
              />
              <h1 className="text-3xl font-semibold mb-2 min-h-[2.5rem]">
                <Typewriter text={`Hey${firstName ? ` ${firstName}` : ''}`} />
              </h1>
              <p className="text-[#6b6b76] dark:text-[#8e8ea0] italic mb-1 max-w-md text-center">“{quote}”</p>
              <p className="text-[#6b6b76] dark:text-[#8e8ea0] mb-8">Ask me anything about the CRM.</p>

              <DailySnapshot />


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button key={s.title} onClick={() => { setInput(s.title); textareaRef.current?.focus(); }} className="text-left p-4 rounded-2xl border border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5 transition-colors">
                    <div className="font-medium mb-0.5">{s.title}</div>
                    <div className="text-sm text-[#6b6b76] dark:text-[#8e8ea0]">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-[#1a1a1a] text-white dark:bg-[#2f2f2f] rounded-3xl px-5 py-3 whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 text-sm font-semibold">C</div>
                    <div className="flex-1 pt-1 leading-relaxed">
                      {m.content && <MarkdownMessage>{m.content}</MarkdownMessage>}
                      {(m.proposals?.length ?? 0) > 0 && (
                        <div>
                          {m.proposals!.length > 1 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-[#262626] px-4 py-3">
                              <span className="text-sm text-[#55555e] dark:text-[#c5c5d2]">
                                {m.proposals!.length} proposals need your approval
                              </span>
                              <div className="ml-auto flex gap-2">
                                <button
                                  onClick={() => confirmAll(m)}
                                  disabled={!m.proposals!.some((p) => p.state === 'pending' || p.state === 'error')}
                                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black text-sm font-medium transition-colors"
                                >
                                  Confirm all
                                </button>
                                <button
                                  onClick={() => cancelAll(m)}
                                  disabled={!m.proposals!.some((p) => p.state === 'pending' || p.state === 'error')}
                                  className="px-3 py-1.5 rounded-xl border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5 disabled:opacity-40 text-sm transition-colors"
                                >
                                  Cancel all
                                </button>
                              </div>
                              {m.batchMessage && (
                                <div className="w-full text-xs text-[#6b6b76] dark:text-[#8e8ea0]">{m.batchMessage}</div>
                              )}
                            </div>
                          )}
                          {m.proposals!.map((entry, i) => (
                            <div key={entry.id}>
                              {m.proposals!.length > 1 && (
                                <div className="mt-3 text-xs uppercase tracking-wide text-[#6b6b76] dark:text-[#8e8ea0]">
                                  Proposal {i + 1} of {m.proposals!.length}
                                </div>
                              )}
                              {entry.kind === 'create' ? (
                                <LessonProposalCard
                                  proposal={entry.data as LessonProposal}
                                  state={entry.state}
                                  message={entry.message}
                                  onConfirm={() => confirmEntry(m, entry)}
                                  onCancel={() => cancelEntry(m, entry)}
                                />
                              ) : (
                                <LessonEditProposalCard
                                  proposal={entry.data as LessonEditProposal}
                                  state={entry.state}
                                  message={entry.message}
                                  onConfirm={() => confirmEntry(m, entry)}
                                  onCancel={() => cancelEntry(m, entry)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {m.toolStatus && (

                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#6b6b76] dark:text-[#8e8ea0] bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {m.toolStatus}
                        </div>
                      )}
                      {!m.content && !m.toolStatus && loading && (
                        <div className="inline-flex items-center gap-2 text-xs text-[#6b6b76] dark:text-[#8e8ea0]">
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
            <div className="relative flex items-end bg-white dark:bg-[#2f2f2f] rounded-3xl border border-black/10 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-black/30">
              <textarea
                ref={textareaRef}
                value={recordingState === 'recording' ? `Recording… ${formatDuration(recordingDuration)}` : input}
                onChange={(e) => { setInput(e.target.value); autoresize(); }}
                onKeyDown={handleKeyDown}
                rows={1}
                readOnly={recordingState !== 'idle'}
                placeholder={recordingState === 'processing' ? 'Transcribing…' : 'Message Agent Cleo'}
                className="flex-1 bg-transparent resize-none px-5 py-4 pr-32 outline-none placeholder:text-[#6b6b76] dark:placeholder:text-[#8e8ea0] max-h-[220px]"
              />
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
                {recordingState === 'recording' && (
                  <button
                    onClick={cancelRecording}
                    className="w-9 h-9 rounded-full border border-black/15 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Cancel recording"
                    title="Cancel recording"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={recordingState === 'recording' ? stopRecordingAndTranscribe : startRecording}
                  disabled={loading || recordingState === 'processing'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
                    recordingState === 'recording'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-black/15 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
                  }`}
                  aria-label={recordingState === 'recording' ? 'Stop recording' : 'Record voice message'}
                  title={recordingState === 'recording' ? 'Stop and transcribe' : 'Record voice message'}
                >
                  {recordingState === 'processing'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : recordingState === 'recording'
                      ? <Square className="w-4 h-4" />
                      : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || recordingState !== 'idle'}
                  className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-30 transition-colors"
                  aria-label="Send"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-[#6b6b76] dark:text-[#8e8ea0] mt-2">Agent Cleo has read-only access to the CRM database.</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AgentCleo;
