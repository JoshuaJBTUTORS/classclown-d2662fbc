import { supabase } from '@/integrations/supabase/client';

export interface ExamSummary {
  totalStudents: number;
  totalSessions: number;
  totalSubjects: number;
  totalAssessments: number;
  averageCompletionTimeMinutes: number;
}

export interface SubjectExamResult {
  subject: string;
  assessmentId: string;
  assessmentTitle: string;
  totalMarks: number;
  studentsCompleted: number;
  averageScore: number;
  averagePercentage: number;
}

export interface StudentExamResult {
  userId: string;
  studentName: string;
  email: string;
  examsCompleted: number;
  subjects: string[];
  lastCompletedAt: string;
  totalMarksAchieved: number;
  totalMarksAvailable: number;
}

export interface StudentExamSession {
  sessionId: string;
  assessmentId: string;
  assessmentTitle: string;
  subject: string;
  completedAt: string;
  timeTakenMinutes: number;
  marksAchieved: number;
  marksAvailable: number;
}

export interface StudentResponse {
  id: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  marksAwarded: number;
  marksAvailable: number;
  submittedAt: string;
  aiFeedback?: string;
  markingBreakdown?: any;
  confidenceScore?: number;
  markedBy?: string;
  markedAt?: string;
}

export interface MarkingJob {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalResponses: number;
  markedCount: number;
  errorCount: number;
  startedAt?: string;
  completedAt?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
}

export const examResultsService = {
  async getExamWeekSummary(startDate?: string, endDate?: string): Promise<ExamSummary> {
    const start = startDate || '2025-12-15';
    const end = endDate || '2026-01-17';

    // Get completed sessions count
    const { data: sessions, error: sessionsError } = await supabase
      .from('assessment_sessions')
      .select('id, user_id, time_taken_minutes, assessment_id')
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end);

    if (sessionsError) throw sessionsError;

    // Get unique students
    const uniqueStudents = new Set(sessions?.map(s => s.user_id) || []);
    
    // Get unique assessments
    const uniqueAssessments = new Set(sessions?.map(s => s.assessment_id) || []);

    // Get subjects from assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('ai_assessments')
      .select('subject')
      .in('id', Array.from(uniqueAssessments));

    if (assessmentsError) throw assessmentsError;

    const uniqueSubjects = new Set(assessments?.map(a => a.subject).filter(Boolean) || []);

    // Calculate average completion time
    const totalTime = sessions?.reduce((sum, s) => sum + (s.time_taken_minutes || 0), 0) || 0;
    const avgTime = sessions?.length ? Math.round(totalTime / sessions.length) : 0;

    return {
      totalStudents: uniqueStudents.size,
      totalSessions: sessions?.length || 0,
      totalSubjects: uniqueSubjects.size,
      totalAssessments: uniqueAssessments.size,
      averageCompletionTimeMinutes: avgTime
    };
  },

  async getResultsBySubject(startDate?: string, endDate?: string): Promise<SubjectExamResult[]> {
    const start = startDate || '2025-12-15';
    const end = endDate || '2026-01-17';

    const { data: sessions, error } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        user_id,
        total_marks_achieved,
        total_marks_available,
        assessment_id,
        ai_assessments!inner (
          id,
          title,
          subject,
          total_marks
        )
      `)
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end);

    if (error) throw error;

    // Group by assessment
    const assessmentMap = new Map<string, {
      subject: string;
      title: string;
      totalMarks: number;
      sessions: { marksAchieved: number; marksAvailable: number; userId: string }[];
    }>();

    sessions?.forEach(session => {
      const assessment = session.ai_assessments as any;
      if (!assessment) return;

      const key = session.assessment_id;
      if (!assessmentMap.has(key)) {
        assessmentMap.set(key, {
          subject: assessment.subject || 'Unknown',
          title: assessment.title,
          totalMarks: assessment.total_marks || 0,
          sessions: []
        });
      }
      
      assessmentMap.get(key)!.sessions.push({
        marksAchieved: session.total_marks_achieved || 0,
        marksAvailable: session.total_marks_available || 0,
        userId: session.user_id || ''
      });
    });

    const results: SubjectExamResult[] = [];
    assessmentMap.forEach((data, assessmentId) => {
      const uniqueStudents = new Set(data.sessions.map(s => s.userId));
      const totalAchieved = data.sessions.reduce((sum, s) => sum + s.marksAchieved, 0);
      const totalAvailable = data.sessions.reduce((sum, s) => sum + s.marksAvailable, 0);
      const avgScore = data.sessions.length ? totalAchieved / data.sessions.length : 0;
      const avgPercentage = totalAvailable > 0 ? (totalAchieved / totalAvailable) * 100 : 0;

      results.push({
        subject: data.subject,
        assessmentId,
        assessmentTitle: data.title,
        totalMarks: data.totalMarks,
        studentsCompleted: uniqueStudents.size,
        averageScore: Math.round(avgScore * 10) / 10,
        averagePercentage: Math.round(avgPercentage * 10) / 10
      });
    });

    return results.sort((a, b) => a.subject.localeCompare(b.subject));
  },

  async getResultsByStudent(startDate?: string, endDate?: string): Promise<StudentExamResult[]> {
    const start = startDate || '2025-12-15';
    const end = endDate || '2026-01-17';

    const { data: sessions, error } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        user_id,
        completed_at,
        total_marks_achieved,
        total_marks_available,
        ai_assessments!inner (
          subject
        )
      `)
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end);

    if (error) throw error;

    // Get user profiles
    const userIds = [...new Set(sessions?.map(s => s.user_id).filter(Boolean) || [])];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get emails from auth (via students table if available)
    const { data: students } = await supabase
      .from('students')
      .select('user_id, email')
      .in('user_id', userIds);

    const emailMap = new Map(students?.map(s => [s.user_id, s.email]) || []);

    // Group by user
    const userMap = new Map<string, {
      subjects: Set<string>;
      examsCompleted: number;
      lastCompletedAt: string;
      totalMarksAchieved: number;
      totalMarksAvailable: number;
    }>();

    sessions?.forEach(session => {
      const userId = session.user_id;
      if (!userId) return;

      const assessment = session.ai_assessments as any;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          subjects: new Set(),
          examsCompleted: 0,
          lastCompletedAt: session.completed_at || '',
          totalMarksAchieved: 0,
          totalMarksAvailable: 0
        });
      }
      
      const userData = userMap.get(userId)!;
      if (assessment?.subject) userData.subjects.add(assessment.subject);
      userData.examsCompleted++;
      userData.totalMarksAchieved += session.total_marks_achieved || 0;
      userData.totalMarksAvailable += session.total_marks_available || 0;
      
      if (session.completed_at && session.completed_at > userData.lastCompletedAt) {
        userData.lastCompletedAt = session.completed_at;
      }
    });

    const results: StudentExamResult[] = [];
    userMap.forEach((data, userId) => {
      const profile = profileMap.get(userId);
      const studentName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';

      results.push({
        userId,
        studentName,
        email: emailMap.get(userId) || '',
        examsCompleted: data.examsCompleted,
        subjects: Array.from(data.subjects),
        lastCompletedAt: data.lastCompletedAt,
        totalMarksAchieved: data.totalMarksAchieved,
        totalMarksAvailable: data.totalMarksAvailable
      });
    });

    return results.sort((a, b) => b.examsCompleted - a.examsCompleted);
  },

  async getStudentSessions(userId: string, startDate?: string, endDate?: string): Promise<StudentExamSession[]> {
    const start = startDate || '2025-12-15';
    const end = endDate || '2026-01-17';

    const { data: sessions, error } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        assessment_id,
        completed_at,
        time_taken_minutes,
        total_marks_achieved,
        total_marks_available,
        ai_assessments!inner (
          title,
          subject
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return (sessions || []).map(session => {
      const assessment = session.ai_assessments as any;
      return {
        sessionId: session.id,
        assessmentId: session.assessment_id,
        assessmentTitle: assessment?.title || 'Unknown',
        subject: assessment?.subject || 'Unknown',
        completedAt: session.completed_at || '',
        timeTakenMinutes: session.time_taken_minutes || 0,
        marksAchieved: session.total_marks_achieved || 0,
        marksAvailable: session.total_marks_available || 0
      };
    });
  },

  async getSessionResponses(sessionId: string): Promise<StudentResponse[]> {
    const { data: responses, error } = await supabase
      .from('student_responses')
      .select(`
        id,
        question_id,
        student_answer,
        marks_awarded,
        created_at,
        ai_feedback,
        marking_breakdown,
        confidence_score,
        marked_by,
        marked_at,
        assessment_questions!inner (
          question_number,
          question_text,
          correct_answer,
          marks_available
        )
      `)
      .eq('session_id', sessionId)
      .order('assessment_questions(question_number)', { ascending: true });

    if (error) throw error;

    return (responses || []).map(response => {
      const question = response.assessment_questions as any;
      return {
        id: response.id,
        questionId: response.question_id,
        questionNumber: question?.question_number || 0,
        questionText: question?.question_text || '',
        correctAnswer: question?.correct_answer || '',
        studentAnswer: response.student_answer || '',
        marksAwarded: response.marks_awarded || 0,
        marksAvailable: question?.marks_available || 0,
        submittedAt: response.created_at || '',
        aiFeedback: response.ai_feedback || undefined,
        markingBreakdown: response.marking_breakdown || undefined,
        confidenceScore: response.confidence_score || undefined,
        markedBy: response.marked_by || undefined,
        markedAt: response.marked_at || undefined
      };
    });
  },

  async exportResultsCSV(startDate?: string, endDate?: string): Promise<string> {
    const students = await this.getResultsByStudent(startDate, endDate);
    
    const headers = ['Student Name', 'Email', 'Exams Completed', 'Subjects', 'Total Marks Achieved', 'Total Marks Available', 'Percentage', 'Last Completed'];
    const rows = students.map(s => [
      s.studentName,
      s.email,
      s.examsCompleted.toString(),
      s.subjects.join('; '),
      s.totalMarksAchieved.toString(),
      s.totalMarksAvailable.toString(),
      s.totalMarksAvailable > 0 ? ((s.totalMarksAchieved / s.totalMarksAvailable) * 100).toFixed(1) + '%' : 'N/A',
      s.lastCompletedAt ? new Date(s.lastCompletedAt).toLocaleDateString() : ''
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  },

  async getUnmarkedCount(startDate?: string, endDate?: string): Promise<number> {
    const start = startDate || '2025-12-15';
    const end = endDate || '2026-01-17';

    // Get sessions in date range
    const { data: sessions } = await supabase
      .from('assessment_sessions')
      .select('id')
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end);

    if (!sessions || sessions.length === 0) return 0;

    const sessionIds = sessions.map(s => s.id);

    // Count unmarked responses
    const { count, error } = await supabase
      .from('student_responses')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .is('marked_at', null);

    if (error) throw error;
    return count || 0;
  },

  async getActiveMarkingJob(): Promise<MarkingJob | null> {
    const { data, error } = await supabase
      .from('marking_jobs')
      .select('*')
      .in('status', ['pending', 'running', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      status: data.status as MarkingJob['status'],
      totalResponses: data.total_responses,
      markedCount: data.marked_count,
      errorCount: data.error_count,
      startedAt: data.started_at || undefined,
      completedAt: data.completed_at || undefined,
      dateRangeStart: data.date_range_start,
      dateRangeEnd: data.date_range_end
    };
  },

  async createMarkingJob(startDate: string, endDate: string): Promise<string> {
    // Get total count of responses to mark
    const totalResponses = await this.getUnmarkedCount(startDate, endDate);

    const { data, error } = await supabase
      .from('marking_jobs')
      .insert({
        status: 'pending',
        total_responses: totalResponses,
        marked_count: 0,
        error_count: 0,
        date_range_start: startDate,
        date_range_end: endDate
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async pauseMarkingJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('marking_jobs')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', jobId);

    if (error) throw error;
  }
};
