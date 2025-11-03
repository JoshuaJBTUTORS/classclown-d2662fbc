-- Add lesson_id and module_id to cleo_conversations for lesson-specific chat
ALTER TABLE public.cleo_conversations
ADD COLUMN lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
ADD COLUMN module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;

-- Create index for efficient lesson-based conversation lookup
CREATE INDEX idx_cleo_conversations_lesson_id ON public.cleo_conversations(lesson_id);
CREATE INDEX idx_cleo_conversations_module_id ON public.cleo_conversations(module_id);

-- Create index for user + lesson combination (most common query)
CREATE INDEX idx_cleo_conversations_user_lesson ON public.cleo_conversations(user_id, lesson_id) WHERE lesson_id IS NOT NULL;