CREATE TABLE public.agent_cleo_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_cleo_threads TO authenticated;
GRANT ALL ON public.agent_cleo_threads TO service_role;

ALTER TABLE public.agent_cleo_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own agent cleo threads"
ON public.agent_cleo_threads FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.agent_cleo_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.agent_cleo_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_cleo_messages_thread ON public.agent_cleo_messages(thread_id, created_at);
CREATE INDEX idx_agent_cleo_threads_user ON public.agent_cleo_threads(user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_cleo_messages TO authenticated;
GRANT ALL ON public.agent_cleo_messages TO service_role;

ALTER TABLE public.agent_cleo_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage messages in their own agent cleo threads"
ON public.agent_cleo_messages FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.agent_cleo_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.agent_cleo_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_cleo_threads_updated_at
BEFORE UPDATE ON public.agent_cleo_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();