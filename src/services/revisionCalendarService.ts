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
      status: 'active' as const,
      study_technique: setupData.studyTechnique,
      daily_start_time: setupData.dailyStartTime,
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
    // Get user role
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const userRole = userRoleData?.role;

    let allCoursesForUser: ({ id: string; title: string; subject: string; } | null)[] = [];

    if (userRole === 'owner' || userRole === 'admin') {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, subject')
        .in('subject', setupData.selectedSubjects);

      if (coursesError) throw coursesError;
      allCoursesForUser = courses || [];
    } else { // student, parent, or other roles
      const { data: purchasedCourses } = await supabase
        .from('course_purchases')
        .select('course_id, courses(id, title, subject)')
        .eq('user_id', userId)
        .eq('status', 'completed');
      
      if (purchasedCourses) {
        allCoursesForUser = purchasedCourses.map(p => p.courses);
      }
    }
    
    if (allCoursesForUser.length === 0) {
      console.warn("No courses found for this user to generate a revision schedule.");
      return;
    }

    let availableCourses = allCoursesForUser
      .filter((course): course is { id: string; title: string; subject: string; } => 
        course !== null && setupData.selectedSubjects.includes(course.subject)
      );

    // --- Smart Scheduling Logic ---
    try {
      // FIX: getUserTopicPerformance expects 0-1 arguments, not 2.
      const allWeakTopics = await topicPerformanceService.getUserTopicPerformance();
      
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

    if (availableCourses.length === 0) {
        console.warn("No available courses for selected subjects to generate revision sessions.");
        return;
    }

    const sessions: Omit<RevisionSession, 'id' | 'created_at' | 'updated_at' | 'completion_notes' | 'completed_at'>[] = [];
    const startDate = new Date(setupData.startDate);
    const endDate = setupData.endDate || new Date(new Date().setDate(startDate.getDate() + 84)); // 12 weeks
    let currentDate = new Date(startDate);
    let courseIndex = 0;
    
    const totalWeeklyMinutes = setupData.weeklyHours * 60;
    const minutesPerDay = totalWeeklyMinutes / (setupData.selectedDays.length || 1);

    while (currentDate <= endDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (setupData.selectedDays.includes(dayName)) {
        const course = availableCourses[courseIndex % availableCourses.length];
        let currentTime = setupData.dailyStartTime;
        
        let minutesScheduledForDay = 0;

        if (setupData.studyTechnique === 'pomodoro') {
          let pomodoroCount = 0;
          while(minutesScheduledForDay < minutesPerDay) {
            const studyDuration = 25;
            const studyEndTime = this.addMinutesToTime(currentTime, studyDuration);
            sessions.push({ schedule_id: scheduleId, course_id: course.id, subject: course.subject, session_date: currentDate.toISOString().split('T')[0], start_time: currentTime, end_time: studyEndTime, duration_minutes: studyDuration, status: 'scheduled', session_type: 'study' });
            minutesScheduledForDay += studyDuration;
            pomodoroCount++;
            
            const breakDuration = pomodoroCount % 4 === 0 ? 15 : 5;
            const breakStartTime = studyEndTime;
            const breakEndTime = this.addMinutesToTime(breakStartTime, breakDuration);
            sessions.push({ schedule_id: scheduleId, course_id: course.id, subject: course.subject, session_date: currentDate.toISOString().split('T')[0], start_time: breakStartTime, end_time: breakEndTime, duration_minutes: breakDuration, status: 'scheduled', session_type: 'break' });

            currentTime = breakEndTime;
            if (minutesScheduledForDay >= minutesPerDay) break;
          }
        } else if (setupData.studyTechnique === '60_10_rule') {
           while(minutesScheduledForDay < minutesPerDay) {
            const studyDuration = 60;
            const studyEndTime = this.addMinutesToTime(currentTime, studyDuration);
            sessions.push({ schedule_id: scheduleId, course_id: course.id, subject: course.subject, session_date: currentDate.toISOString().split('T')[0], start_time: currentTime, end_time: studyEndTime, duration_minutes: studyDuration, status: 'scheduled', session_type: 'study' });
            minutesScheduledForDay += studyDuration;

            const breakDuration = 10;
            const breakStartTime = studyEndTime;
            const breakEndTime = this.addMinutesToTime(breakStartTime, breakDuration);
            sessions.push({ schedule_id: scheduleId, course_id: course.id, subject: course.subject, session_date: currentDate.toISOString().split('T')[0], start_time: breakStartTime, end_time: breakEndTime, duration_minutes: breakDuration, status: 'scheduled', session_type: 'break' });
            
            currentTime = breakEndTime;
            if (minutesScheduledForDay >= minutesPerDay) break;
           }
        } else { // 'subject_rotation' or 'none'
            const sessionDuration = Math.round(minutesPerDay);
            if (sessionDuration > 0) {
              const endTime = this.addMinutesToTime(currentTime, sessionDuration);
              sessions.push({ schedule_id: scheduleId, course_id: course.id, subject: course.subject, session_date: currentDate.toISOString().split('T')[0], start_time: currentTime, end_time: endTime, duration_minutes: sessionDuration, status: 'scheduled', session_type: 'study' });
            }
        }

        courseIndex++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (sessions.length > 0) {
      const { error } = await supabase.from('revision_sessions').insert(sessions);
      if (error) throw error;
    }
  },

  // Get revision sessions for calendar display
  async getRevisionSessions(): Promise<RevisionSession[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data: activeSchedules, error: schedulesError } = await supabase
      .from('revision_schedules')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (schedulesError) {
      console.error('Error fetching active schedules:', schedulesError);
      return [];
    };
    if (!activeSchedules || activeSchedules.length === 0) return [];

    const scheduleIds = activeSchedules.map(s => s.id);

    const { data, error } = await supabase
      .from('revision_sessions')
      .select('*')
      .in('schedule_id', scheduleIds)
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
  },

  async resetActiveSchedule(): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: activeSchedule, error: findError } = await supabase
      .from('revision_schedules')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (findError || !activeSchedule) {
      console.warn("No active schedule to reset.");
      return;
    }

    const { error: updateError } = await supabase
      .from('revision_schedules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', activeSchedule.id);
    
    if (updateError) throw updateError;
  }
};
