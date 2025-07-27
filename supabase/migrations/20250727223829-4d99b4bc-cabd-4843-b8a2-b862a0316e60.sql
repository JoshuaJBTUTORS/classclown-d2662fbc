-- Add WhatsApp fields to parents table
ALTER TABLE public.parents 
ADD COLUMN whatsapp_enabled boolean DEFAULT true,
ADD COLUMN whatsapp_number text;

-- Add WhatsApp fields to students table  
ALTER TABLE public.students
ADD COLUMN whatsapp_enabled boolean DEFAULT true,
ADD COLUMN whatsapp_number text;

-- Add comment for documentation
COMMENT ON COLUMN public.parents.whatsapp_enabled IS 'Whether WhatsApp notifications are enabled for this parent';
COMMENT ON COLUMN public.parents.whatsapp_number IS 'WhatsApp phone number in international format (e.g., +447413069120)';
COMMENT ON COLUMN public.students.whatsapp_enabled IS 'Whether WhatsApp notifications are enabled for this student';
COMMENT ON COLUMN public.students.whatsapp_number IS 'WhatsApp phone number in international format (e.g., +447413069120)';