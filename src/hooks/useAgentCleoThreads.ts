import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AgentCleoThread {
  id: string;
  title: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const titleFromText = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 50 ? `${clean.slice(0, 50)}…` : clean || 'New chat';
};

export const useAgentCleoThreads = () => {
  const [threads, setThreads] = useState<AgentCleoThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const { toast } = useToast();

  const loadThreads = useCallback(async () => {
    const { data, error } = await supabase
      .from('agent_cleo_threads')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load Agent Cleo threads:', error);
    } else {
      setThreads(data ?? []);
    }
    setLoadingThreads(false);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const loadMessages = useCallback(async (threadId: string): Promise<StoredMessage[]> => {
    const { data, error } = await supabase
      .from('agent_cleo_messages')
      .select('id, role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: 'Could not load that conversation',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
    return (data ?? []).map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }, [toast]);

  const createThread = useCallback(async (firstMessage: string): Promise<string | null> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('agent_cleo_threads')
      .insert({ user_id: userId, title: titleFromText(firstMessage) })
      .select('id, title, updated_at')
      .single();

    if (error || !data) {
      console.error('Failed to create conversation:', error);
      toast({
        title: 'Could not save this chat',
        description: error?.message ?? 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }

    setThreads((prev) => [data, ...prev]);
    return data.id;
  }, [toast]);

  const saveMessage = useCallback(async (
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
  ) => {
    const { error } = await supabase
      .from('agent_cleo_messages')
      .insert({ thread_id: threadId, role, content });

    if (error) {
      console.error('Failed to save message:', error);
      toast({
        title: 'Message not saved',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    await supabase.from('agent_cleo_threads').update({ updated_at: now }).eq('id', threadId);
    setThreads((prev) => {
      const next = prev.map((t) => (t.id === threadId ? { ...t, updated_at: now } : t));
      return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    });
  }, [toast]);

  const renameThread = useCallback(async (threadId: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title: clean } : t)));
    const { error } = await supabase
      .from('agent_cleo_threads')
      .update({ title: clean })
      .eq('id', threadId);
    if (error) {
      toast({ title: 'Rename failed', description: error.message, variant: 'destructive' });
      loadThreads();
    }
  }, [toast, loadThreads]);

  const deleteThread = useCallback(async (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    const { error } = await supabase.from('agent_cleo_threads').delete().eq('id', threadId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      loadThreads();
    }
  }, [toast, loadThreads]);

  return {
    threads,
    loadingThreads,
    loadMessages,
    createThread,
    saveMessage,
    renameThread,
    deleteThread,
  };
};
