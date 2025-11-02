import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CleoMessage } from './CleoMessage';
import { CleoInput } from './CleoInput';
import { CleoWelcome } from './CleoWelcome';
import { Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  topic: string | null;
  year_group: string | null;
  learning_goal: string | null;
  status: string;
}

export const CleoChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load active conversation on mount
  useEffect(() => {
    loadActiveConversation();
  }, [user]);

  const loadActiveConversation = async () => {
    if (!user) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('cleo_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convError) throw convError;

      if (convData) {
        setConversation(convData);
        
        // Load messages for this conversation
        const { data: msgData, error: msgError } = await supabase
          .from('cleo_messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages((msgData || []).map(msg => ({
          ...msg,
          role: msg.role as 'user' | 'assistant' | 'system'
        })));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);

    // Create a temporary assistant message that we'll update with streaming content
    const tempAssistantId = crypto.randomUUID();
    const tempAssistantMessage: Message = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempAssistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const FUNCTIONS_BASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://sjxbxkpegcnnfjbsxazo.supabase.co').replace(/\/+$/, '');

      const response = await fetch(
        `${FUNCTIONS_BASE_URL}/functions/v1/cleo-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversation?.id,
            message: content.trim(),
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('cleo-chat error:', { status: response.status, body: errorBody });
        throw new Error(`Failed to send message (${response.status})`);
      }

      // Get conversation ID from response header
      const conversationId = response.headers.get('X-Conversation-Id');
      if (conversationId && !conversation) {
        const { data: newConv } = await supabase
          .from('cleo_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
        if (newConv) setConversation(newConv);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === tempAssistantId
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      setIsLoading(false);
      setIsStreaming(false);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.name !== 'AbortError') {
        toast.error('Failed to send message');
        // Remove the temp assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
      }
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleNewConversation = () => {
    setConversation(null);
    setMessages([]);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to use Cleo AI Tutor</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return <CleoWelcome onSendMessage={handleSendMessage} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Cleo AI Tutor</h2>
            {conversation?.topic && (
              <p className="text-sm text-muted-foreground">
                {conversation.topic} • {conversation.year_group}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleNewConversation}
          className="text-sm text-primary hover:underline"
        >
          New Topic
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <CleoMessage key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cleo is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <CleoInput
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
};
