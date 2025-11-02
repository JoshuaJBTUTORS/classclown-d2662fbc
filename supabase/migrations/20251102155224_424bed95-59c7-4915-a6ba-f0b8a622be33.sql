-- Create tables for Cleo AI Tutor

-- Table to store conversation sessions
CREATE TABLE IF NOT EXISTS public.cleo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  year_group TEXT,
  learning_goal TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store individual messages in conversations
CREATE TABLE IF NOT EXISTS public.cleo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to track learning progress
CREATE TABLE IF NOT EXISTS public.cleo_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  understanding_level INTEGER NOT NULL CHECK (understanding_level >= 1 AND understanding_level <= 5),
  questions_asked INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cleo_conversations_user_id ON public.cleo_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_cleo_messages_conversation_id ON public.cleo_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cleo_learning_progress_conversation_id ON public.cleo_learning_progress(conversation_id);

-- Enable Row Level Security
ALTER TABLE public.cleo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_learning_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cleo_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.cleo_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.cleo_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.cleo_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.cleo_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cleo_messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.cleo_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_messages.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.cleo_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_messages.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON public.cleo_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_messages.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON public.cleo_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_messages.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for cleo_learning_progress
CREATE POLICY "Users can view progress from their conversations"
  ON public.cleo_learning_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_learning_progress.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create progress in their conversations"
  ON public.cleo_learning_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_learning_progress.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update progress in their conversations"
  ON public.cleo_learning_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_conversations
      WHERE cleo_conversations.id = cleo_learning_progress.conversation_id
      AND cleo_conversations.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cleo_conversations_updated_at
  BEFORE UPDATE ON public.cleo_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_cleo_updated_at();

CREATE TRIGGER update_cleo_learning_progress_updated_at
  BEFORE UPDATE ON public.cleo_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_cleo_updated_at();