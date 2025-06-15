import { supabase } from '@/integrations/supabase/client';
import { RevisionSchedule, RevisionSession, RevisionProgress, RevisionSetupData } from '@/types/revision';
import { topicPerformanceService } from './topicPerformanceService';

export const revisionCalendarService = {
  // Get user's revision schedules
  async getRevisionSchedules(): Promise<RevisionSchedule[]> {
    const { data, error } = await supabase
      .from('revision_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RevisionSchedule[];
  },

  // Create a new revision schedule
  async createRevisionSchedule(setupData: RevisionSetupData): Promise<RevisionSchedule> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const scheduleData = {
      user_id: user.user.id,
      name: setupData.name,
      weekly_hours: setupData.weeklyHours,
      selected_days: setupData.selectedDays,
      start_date: setupData.startDate.toISOString().split('T')[0],
      end_date: setupData.endDate?.toISOString().split('T')[0] || null,
      status: 'active' as const
    };

    const { data, error } = await supabase
      .from('revision_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;
    
    // Generate sessions for this schedule, passing user ID for smart scheduling
    await this.generateRevisionSessions(data.id, setupData, user.user.id);
    
    return data as RevisionSchedule;
  },

  // Generate revision sessions based on schedule
  async generateRevisionSessions(scheduleId: string, setupData: RevisionSetupData, userId: string): Promise<void> {
    const { data: purchasedCourses } = await supabase
      .from('course_purchases')
      .select('course_id, courses(id, title, subject)')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (!purchasedCourses || purchasedCourses.length === 0) return;

    let availableCourses = purchasedCourses
      .map(purchase => purchase.courses)
      .filter((course): course is { id: string; title: string; subject: string; } => 
        course !== null && setupData.selectedSubjects.includes(course.subject)
      );

    // --- Smart Scheduling Logic ---
    try {
      const allWeakTopics = await topicPerformanceService.getUserTopicPerformance(undefined, userId);
      
      if (allWeakTopics && allWeakTopics.length > 0) {
          const subjectScores: { [key: string]: number } = {};

          allWeakTopics.forEach(topic => {
              if (setupData.selectedSubjects.includes(topic.subject)) {
                  if (!subjectScores[topic.subject]) {
                      subjectScores[topic.subject] = 0;
                  }
                  // Weighting by error rate
                  subjectScores[topic.subject] += topic.errorRate;
              }
          });

          availableCourses.sort((a, b) => {
              const scoreA = subjectScores[a.subject] || 0;
              const scoreB = subjectScores[b.subject] || 0;
              return scoreB - scoreA; // Sort descending by weakness score
          });
      }
    } catch (error) {
        console.error("Could not fetch weak topics for smart scheduling, falling back to default.", error);
    }
    // --- End of Smart Scheduling Logic ---

    // Calculate session duration and distribution
    const sessionsPerWeek = setupData.selectedDays.length;
    const hoursPerSession = setupData.weeklyHours / sessionsPerWeek;
    const minutesPerSession = Math.round(hoursPerSession * 60);

    // Generate sessions for the next 12 weeks (or until end date)
    const sessions: any[] = [];
    const startDate = new Date(setupData.startDate);
    const endDate = setupData.endDate || new Date(startDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000));

    let currentDate = new Date(startDate);
    let courseIndex = 0;

    while (currentDate <= endDate && availableCourses.length > 0) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (setupData.selectedDays.includes(dayName)) {
        const course = availableCourses[courseIndex % availableCourses.length];
        const startTime = '09:00'; // Default start time
        const endTime = this.addMinutesToTime(startTime, minutesPerSession);

        sessions.push({
          schedule_id: scheduleId,
          course_id: course.id,
          subject: course.subject,
          session_date: currentDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          duration_minutes: minutesPerSession,
          status: 'scheduled'
        });

        courseIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (sessions.length > 0) {
      const { error } = await supabase
        .from('revision_sessions')
        .insert(sessions);

      if (error) throw error;
    }
  },

  // Get revision sessions for calendar display
  async getRevisionSessions(): Promise<RevisionSession[]> {
    const { data, error } = await supabase
      .from('revision_sessions')
      .select('*')
      .order('session_date', { ascending: true });

    if (error) throw error;
    return (data || []) as RevisionSession[];
  },

  // Update session status
  async updateSessionStatus(sessionId: string, status: RevisionSession['status'], notes?: string): Promise<void> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completion_notes = notes;
    }

    const { error } = await supabase
      .from('revision_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Add revision progress
  async addRevisionProgress(progressData: Omit<RevisionProgress, 'id' | 'created_at'>): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('revision_progress')
      .insert({
        ...progressData,
        user_id: user.user.id
      });

    if (error) throw error;
  },

  // Helper function to add minutes to time string
  addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
};
