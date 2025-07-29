import { supabase } from '@/integrations/supabase/client';

interface CreateDemoSessionData {
  lessonId: string;
  adminId: string;
  startTime: Date;
  endTime: Date;
}

export const createDemoSession = async (data: CreateDemoSessionData) => {
  const { data: demoSession, error } = await supabase
    .from('demo_sessions')
    .insert({
      lesson_id: data.lessonId,
      admin_id: data.adminId,
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating demo session:', error);
    throw new Error('Failed to create demo session');
  }

  return demoSession;
};

export const getDemoSessionsForAdmin = async (adminId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('demo_sessions')
    .select(`
      *,
      lessons (
        title,
        subject,
        lesson_students (
          students (
            first_name,
            last_name
          )
        )
      )
    `)
    .eq('admin_id', adminId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time');

  if (error) {
    console.error('Error fetching demo sessions:', error);
    throw new Error('Failed to fetch demo sessions');
  }

  return data;
};