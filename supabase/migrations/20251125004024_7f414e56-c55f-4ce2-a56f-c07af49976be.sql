-- Create app_settings table for version control
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read app settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Only admins/owners can update app settings
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'owner')
    )
  );

-- Insert initial app version
INSERT INTO public.app_settings (key, value)
VALUES ('app_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;