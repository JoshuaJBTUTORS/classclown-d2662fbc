import { supabase } from '@/integrations/supabase/client';

export interface EngagementMetrics {
  engagementScore: number | null;
  confidenceScore: number | null;
  participationTimePercentage: number | null;
  questionsAsked: number;
  responsesGiven: number;
  confidenceIndicators: {
    confident_statements?: string[];
    hesitation_patterns?: string[];
    improvement_signs?: string[];
  };
}

export interface ConfidenceProgression {
  studentId: number;
  lessons: {
    lessonId: string;
    lessonTitle: string;
    lessonDate: string;
    confidenceScore: number;
    engagementScore: number;
  }[];
  averageConfidence: number;
  averageEngagement: number;
  confidenceTrend: 'improving' | 'declining' | 'stable';
  engagementTrend: 'improving' | 'declining' | 'stable';
}

export class EngagementTrackingService {
  
  /**
   * Get engagement metrics for a specific lesson and student
   */
  async getLessonEngagementMetrics(lessonId: string, studentId: number): Promise<EngagementMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_student_summaries')
        .select(`
          engagement_score,
          confidence_score,
          participation_time_percentage,
          confidence_indicators
        `)
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        engagementScore: data.engagement_score,
        confidenceScore: data.confidence_score,
        participationTimePercentage: data.participation_time_percentage,
        questionsAsked: 0, // Will be extracted from confidence_indicators
        responsesGiven: 0, // Will be extracted from confidence_indicators
        confidenceIndicators: (data.confidence_indicators as any) || {}
      };
    } catch (error) {
      console.error('Error fetching lesson engagement metrics:', error);
      return null;
    }
  }

  /**
   * Get confidence progression for a student over time
   */
  async getStudentConfidenceProgression(studentId: number, limit: number = 10): Promise<ConfidenceProgression | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_student_summaries')
        .select(`
          lesson_id,
          confidence_score,
          engagement_score,
          lesson:lessons(
            id,
            title,
            start_time
          )
        `)
        .eq('student_id', studentId)
        .not('confidence_score', 'is', null)
        .not('engagement_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const lessons = data.map(item => ({
        lessonId: item.lesson_id,
        lessonTitle: item.lesson?.title || 'Unknown Lesson',
        lessonDate: item.lesson?.start_time || '',
        confidenceScore: item.confidence_score || 0,
        engagementScore: item.engagement_score || 0,
      }));

      const averageConfidence = lessons.reduce((sum, lesson) => sum + lesson.confidenceScore, 0) / lessons.length;
      const averageEngagement = lessons.reduce((sum, lesson) => sum + lesson.engagementScore, 0) / lessons.length;

      // Calculate trends (comparing first half vs second half)
      const midpoint = Math.floor(lessons.length / 2);
      const recentLessons = lessons.slice(0, midpoint);
      const olderLessons = lessons.slice(midpoint);

      const recentConfidenceAvg = recentLessons.length > 0 
        ? recentLessons.reduce((sum, l) => sum + l.confidenceScore, 0) / recentLessons.length
        : averageConfidence;
      
      const olderConfidenceAvg = olderLessons.length > 0
        ? olderLessons.reduce((sum, l) => sum + l.confidenceScore, 0) / olderLessons.length
        : averageConfidence;

      const recentEngagementAvg = recentLessons.length > 0
        ? recentLessons.reduce((sum, l) => sum + l.engagementScore, 0) / recentLessons.length
        : averageEngagement;
      
      const olderEngagementAvg = olderLessons.length > 0
        ? olderLessons.reduce((sum, l) => sum + l.engagementScore, 0) / olderLessons.length
        : averageEngagement;

      const confidenceDiff = recentConfidenceAvg - olderConfidenceAvg;
      const engagementDiff = recentEngagementAvg - olderEngagementAvg;

      const gettrend = (diff: number) => {
        if (Math.abs(diff) < 0.5) return 'stable';
        return diff > 0 ? 'improving' : 'declining';
      };

      return {
        studentId,
        lessons: lessons.reverse(), // Show chronologically
        averageConfidence: Math.round(averageConfidence * 10) / 10,
        averageEngagement: Math.round(averageEngagement * 10) / 10,
        confidenceTrend: gettrend(confidenceDiff),
        engagementTrend: gettrend(engagementDiff)
      };
    } catch (error) {
      console.error('Error fetching student confidence progression:', error);
      return null;
    }
  }

  /**
   * Get engagement trends for multiple students
   */
  async getClassEngagementOverview(studentIds: number[], dateFrom?: Date, dateTo?: Date) {
    try {
      let query = supabase
        .from('lesson_student_summaries')
        .select(`
          student_id,
          engagement_score,
          confidence_score,
          created_at,
          lesson:lessons(
            id,
            title,
            start_time
          )
        `)
        .in('student_id', studentIds)
        .not('engagement_score', 'is', null)
        .not('confidence_score', 'is', null);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Group by student and calculate metrics
      const studentMetrics = studentIds.map(studentId => {
        const studentData = data.filter(item => item.student_id === studentId);
        
        if (studentData.length === 0) {
          return {
            studentId,
            averageEngagement: 0,
            averageConfidence: 0,
            totalLessons: 0,
            trend: 'stable' as const
          };
        }

        const avgEngagement = studentData.reduce((sum, item) => sum + (item.engagement_score || 0), 0) / studentData.length;
        const avgConfidence = studentData.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / studentData.length;

        return {
          studentId,
          averageEngagement: Math.round(avgEngagement * 10) / 10,
          averageConfidence: Math.round(avgConfidence * 10) / 10,
          totalLessons: studentData.length,
          trend: 'stable' as const // Simplified for overview
        };
      });

      return studentMetrics;
    } catch (error) {
      console.error('Error fetching class engagement overview:', error);
      return [];
    }
  }

  /**
   * Update student progress with engagement metrics
   */
  async updateStudentProgressWithEngagement(
    lessonId: string, 
    studentId: number, 
    engagementMetrics: Partial<EngagementMetrics>
  ) {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .upsert({
          lesson_id: lessonId,
          student_id: studentId,
          engagement_score: engagementMetrics.engagementScore,
          confidence_increase: engagementMetrics.confidenceScore ? engagementMetrics.confidenceScore - 5 : null, // Relative to baseline of 5
          speaking_time_minutes: engagementMetrics.participationTimePercentage ? 
            (engagementMetrics.participationTimePercentage * 60) / 100 : null, // Assuming 60-min lessons
          questions_asked: engagementMetrics.questionsAsked || 0,
          responses_given: engagementMetrics.responsesGiven || 0,
          participation_metrics: engagementMetrics.confidenceIndicators || {}
        }, {
          onConflict: 'lesson_id,student_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating student progress with engagement:', error);
      throw error;
    }
  }
}

export const engagementTrackingService = new EngagementTrackingService();