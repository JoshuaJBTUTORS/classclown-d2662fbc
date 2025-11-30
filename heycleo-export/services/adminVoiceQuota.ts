import { supabase } from '@/integrations/supabase/client';

export const addVoiceMinutes = async (userEmail: string, minutesToAdd: number) => {
  const { data, error } = await supabase.functions.invoke('admin-add-voice-minutes', {
    body: { userEmail, minutesToAdd }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
