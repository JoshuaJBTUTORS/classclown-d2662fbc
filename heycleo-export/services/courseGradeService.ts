
import { supabase } from '@/integrations/supabase/client';
import { topicPerformanceService } from './topicPerformanceService';

export interface CourseGrade {
  workingAtGrade: number; // 1-9
  averageScore: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  topicMastery: number; // percentage of topics with >75% accuracy
  consistency: number; // how consistent scores are
  explanation: string;
}

export const courseGradeService = {
  // Calculate working at grade (1-9) for a specific course
  async calculateCourseGrade(courseId: string): Promise<CourseGrade> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('subject, title')
      .eq('id', courseId)
      .single();

    if (!course) throw new Error('Course not found');

    // Get assessment sessions for this course
    const { data: sessions } = await supabase
      .from('assessment_sessions')
      .select(`
        total_marks_achieved,
        total_marks_available,
        completed_at,
        ai_assessments(subject)
      `)
      .eq('user_id', user.user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    // Filter sessions by course subject
    const courseSessions = sessions?.filter(session => 
      session.ai_assessments?.subject === course.subject
    ) || [];

    if (courseSessions.length === 0) {
      return {
        workingAtGrade: 1,
        averageScore: 0,
        improvementTrend: 'stable',
        topicMastery: 0,
        consistency: 0,
        explanation: 'No assessment data available for this course yet.'
      };
    }

    // Calculate metrics
    const scores = courseSessions.map(session => {
      const achieved = Number(session.total_marks_achieved) || 0;
      const available = Number(session.total_marks_available) || 1;
      return (achieved / available) * 100;
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Calculate improvement trend (last 3 vs first 3 assessments)
    const improvementTrend = this.calculateImprovementTrend(scores);
    
    // Calculate consistency (standard deviation)
    const consistency = this.calculateConsistency(scores);
    
    // Get topic performance for mastery calculation
    const topicPerformance = await topicPerformanceService.getUserTopicPerformance(courseId);
    const topicMastery = this.calculateTopicMastery(topicPerformance);
    
    // Calculate working at grade (1-9)
    const workingAtGrade = this.calculateWorkingAtGrade(
      averageScore,
      improvementTrend,
      consistency,
      topicMastery
    );

    const explanation = this.generateGradeExplanation(
      workingAtGrade,
      averageScore,
      improvementTrend,
      topicMastery,
      consistency
    );

    return {
      workingAtGrade,
      averageScore: Math.round(averageScore),
      improvementTrend,
      topicMastery: Math.round(topicMastery),
      consistency: Math.round(consistency),
      explanation
    };
  },

  calculateImprovementTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 3) return 'stable';
    
    const recentCount = Math.min(3, Math.floor(scores.length / 2));
    const recentScores = scores.slice(-recentCount);
    const earlierScores = scores.slice(0, recentCount);
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;
    
    const difference = recentAvg - earlierAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  },

  calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 100;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency percentage (100 - normalized std dev)
    return Math.max(0, 100 - (stdDev * 2));
  },

  calculateTopicMastery(topicPerformance: any[]): number {
    if (topicPerformance.length === 0) return 0;
    
    const masteredTopics = topicPerformance.filter(topic => 
      topic.errorRate < 25 // Less than 25% error rate = mastered
    ).length;
    
    return (masteredTopics / topicPerformance.length) * 100;
  },

  calculateWorkingAtGrade(
    averageScore: number,
    improvementTrend: string,
    consistency: number,
    topicMastery: number
  ): number {
    // Base grade from average score
    let baseGrade = 1;
    if (averageScore >= 90) baseGrade = 9;
    else if (averageScore >= 80) baseGrade = 8;
    else if (averageScore >= 70) baseGrade = 7;
    else if (averageScore >= 60) baseGrade = 6;
    else if (averageScore >= 50) baseGrade = 5;
    else if (averageScore >= 40) baseGrade = 4;
    else if (averageScore >= 30) baseGrade = 3;
    else if (averageScore >= 20) baseGrade = 2;
    
    // Adjustments based on other factors
    let adjustments = 0;
    
    // Improvement trend adjustment
    if (improvementTrend === 'improving') adjustments += 0.5;
    else if (improvementTrend === 'declining') adjustments -= 0.5;
    
    // Consistency adjustment
    if (consistency > 80) adjustments += 0.3;
    else if (consistency < 60) adjustments -= 0.3;
    
    // Topic mastery adjustment
    if (topicMastery > 75) adjustments += 0.4;
    else if (topicMastery < 40) adjustments -= 0.4;
    
    const finalGrade = Math.max(1, Math.min(9, Math.round(baseGrade + adjustments)));
    return finalGrade;
  },

  generateGradeExplanation(
    grade: number,
    averageScore: number,
    improvementTrend: string,
    topicMastery: number,
    consistency: number
  ): string {
    const gradeDescriptions = {
      9: 'Outstanding performance',
      8: 'Excellent performance',
      7: 'Good performance',
      6: 'Satisfactory performance',
      5: 'Adequate performance',
      4: 'Working towards expected level',
      3: 'Below expected level',
      2: 'Well below expected level',
      1: 'Significantly below expected level'
    };

    let explanation = `${gradeDescriptions[grade as keyof typeof gradeDescriptions]} with ${averageScore}% average score. `;
    
    if (improvementTrend === 'improving') {
      explanation += 'Shows positive improvement trend. ';
    } else if (improvementTrend === 'declining') {
      explanation += 'Recent performance has declined. ';
    }
    
    if (topicMastery > 75) {
      explanation += 'Strong mastery across topics. ';
    } else if (topicMastery < 40) {
      explanation += 'Several topics need attention. ';
    }
    
    if (consistency < 60) {
      explanation += 'Consider focusing on consistent practice.';
    }
    
    return explanation.trim();
  }
};
