import React, { useState } from 'react';
import { MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import { AgentCleoThread } from '@/hooks/useAgentCleoThreads';

interface Props {
  threads: AgentCleoThread[];
  activeId?: string;
  loading: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export const AgentCleoThreadList: React.FC<Props> = ({
  threads, activeId, loading, onSelect, onRename, onDelete,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (t: AgentCleoThread) => {
    setEditingId(t.id);
    setDraft(t.title);
  };

  const commit = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  if (loading) {
    return <div className="px-3 py-2 text-sm text-[#6b6b76] dark:text-[#8e8ea0]">Loading…</div>;
  }

  if (!threads.length) {
    return <div className="px-3 py-2 text-sm text-[#6b6b76] dark:text-[#8e8ea0]">No saved chats yet</div>;
  }

  return (
    <>
      {threads.map((t) => {
        const isActive = t.id === activeId;
        if (editingId === t.id) {
          return (
            <div key={t.id} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/10">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none"
              />
              <button onClick={commit} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10" aria-label="Save name">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10" aria-label="Cancel rename">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }
        return (
          <div
            key={t.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <button
              onClick={() => onSelect(t.id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <MessageSquare className="w-4 h-4 text-[#6b6b76] dark:text-[#8e8ea0] shrink-0" />
              <span className="text-sm truncate">{t.title}</span>
            </button>
            <button
              onClick={() => startEdit(t)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Rename chat"
            >
              <Pencil className="w-3.5 h-3.5 text-[#6b6b76] dark:text-[#8e8ea0]" />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Delete chat"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#6b6b76] dark:text-[#8e8ea0]" />
            </button>
          </div>
        );
      })}
    </>
  );
};
