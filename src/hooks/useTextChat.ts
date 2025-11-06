import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CleoMessage, ChatMode } from '@/types/cleoTypes';
import { useToast } from '@/hooks/use-toast';

export const useTextChat = (conversationId: string | null) => {
  const [messages, setMessages] = useState<CleoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('cleo_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map database rows to CleoMessage type
      const mappedMessages: CleoMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        mode: (msg.mode || 'text') as ChatMode,
        duration_seconds: msg.duration_seconds,
        created_at: msg.created_at,
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      setIsLoading(true);

      try {
        // Add user message optimistically
        const userMessage: CleoMessage = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: 'user',
          content: content.trim(),
          mode: 'text',
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Call text chat edge function
        const { data, error } = await supabase.functions.invoke('cleo-text-chat', {
          body: {
            conversationId,
            message: content.trim(),
          },
        });

        if (error) throw error;

        // Add assistant message
        if (data?.message) {
          const assistantMessage: CleoMessage = {
            id: data.message.id,
            conversation_id: conversationId,
            role: 'assistant',
            content: data.message.content,
            mode: 'text',
            created_at: data.message.created_at,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });

        // Remove optimistic message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, toast]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages,
  };
};
