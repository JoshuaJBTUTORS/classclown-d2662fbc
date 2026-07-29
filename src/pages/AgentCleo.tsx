import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, MessageSquare, Sparkles, Menu, Trash2 } from 'lucide-react';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { title: 'Summarise this week', subtitle: 'lessons, attendance and homework' },
  { title: 'Find at-risk students', subtitle: 'low engagement or missed lessons' },
  { title: 'Draft a parent update', subtitle: 'friendly progress email' },
  { title: 'Which proposals are pending?', subtitle: 'sent but not yet signed' },
];

const AgentCleo: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const autoresize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: text },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm not wired up to the CRM yet — this is just the interface. Once the backend is connected, I'll be able to answer that.",
      },
    ]);
    setInput('');
    requestAnimationFrame(autoresize);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } shrink-0 overflow-hidden bg-[#171717] transition-all duration-200 ease-out flex flex-col`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={newChat}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-2">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            New chat
          </button>
        </div>

        <div className="px-3 mt-6 mb-2 text-xs font-medium text-[#8e8ea0] uppercase tracking-wider">
          Recent
        </div>
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
          {['Weekly overview', 'Trial follow-ups', 'Tutor payroll July'].map((label) => (
            <div
              key={label}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#8e8ea0] shrink-0" />
              <span className="text-sm truncate flex-1">{label}</span>
              <Trash2 className="w-3.5 h-3.5 text-[#8e8ea0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-xs font-semibold">
              C
            </div>
            <div className="text-sm font-medium">Agent Cleo</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 px-3 h-14 shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 cursor-default">
            <span className="font-semibold">Agent Cleo</span>
            <span className="text-[#8e8ea0] text-sm">CRM</span>
          </div>
        </header>

        {/* Messages / Empty state */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/40">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-semibold mb-2">How can I help today?</h1>
              <p className="text-[#8e8ea0] mb-10">Ask me anything about the CRM.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => {
                      setInput(s.title);
                      textareaRef.current?.focus();
                    }}
                    className="text-left p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                  >
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
                    <div className="max-w-[85%] bg-[#2f2f2f] rounded-3xl px-5 py-3 whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-1 whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-[#2f2f2f] rounded-3xl border border-white/5 shadow-lg">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoresize();
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message Agent Cleo"
                className="flex-1 bg-transparent resize-none px-5 py-4 pr-14 outline-none placeholder:text-[#8e8ea0] max-h-[220px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:bg-white/20 disabled:text-white/40 transition-colors"
                aria-label="Send"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-[#8e8ea0] mt-2">
              Agent Cleo can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCleo;
