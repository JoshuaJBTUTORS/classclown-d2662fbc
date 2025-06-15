
import { supabase } from '@/integrations/supabase/client';
import { assessmentImprovementService, WeakTopic, RecommendedLesson } from './assessmentImprovementService';
import { TopicPerformanceData } from '@/components/learningHub/TopicPerformanceHeatMap';

export const topicPerformanceService = {
  // Get aggregated topic performance data for the current user
  async getUserTopicPerformance(): Promise<TopicPerformanceData[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get all completed assessment sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        assessment_id,
        completed_at,
        total_marks_achieved,
        total_marks_available,
        ai_assessments(subject, title)
      `)
      .eq('user_id', user.user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (sessionsError) throw sessionsError;
    if (!sessions || sessions.length === 0) return [];

    // Get all improvement data for these sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: improvements, error: improvementsError } = await supabase
      .from('assessment_improvements')
      .select('*')
      .in('session_id', sessionIds);

    if (improvementsError) throw improvementsError;

    // Aggregate topic performance data
    const topicMap = new Map<string, {
      topic: string;
      subject: string;
      totalQuestions: number;
      correctAnswers: number;
      assessmentCount: number;
      confidenceScores: number[];
      lastAttempt: string;
      recommendedLessons: Map<string, { id: string; title: string; type: 'video' | 'text' }>;
    }>();

    // Process each improvement record
    improvements?.forEach(improvement => {
      const session = sessions.find(s => s.id === improvement.session_id);
      if (!session || !session.ai_assessments?.subject) return;

      const weakTopics = (improvement.weak_topics as unknown) as WeakTopic[];
      const recommendedLessons = (improvement.recommended_lessons as unknown) as RecommendedLesson[];

      weakTopics.forEach(weakTopic => {
        const key = `${weakTopic.topic}_${session.ai_assessments.subject}`;
        
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            topic: weakTopic.topic,
            subject: session.ai_assessments.subject,
            totalQuestions: 0,
            correctAnswers: 0,
            assessmentCount: 0,
            confidenceScores: [],
            lastAttempt: session.completed_at || '',
            recommendedLessons: new Map()
          });
        }

        const topicData = topicMap.get(key)!;
        topicData.totalQuestions += weakTopic.total_questions;
        topicData.correctAnswers += (weakTopic.total_questions - weakTopic.questions_missed);
        topicData.assessmentCount += 1;
        topicData.confidenceScores.push(weakTopic.confidence_score);
        
        // Update last attempt if this session is more recent
        if (session.completed_at && session.completed_at > topicData.lastAttempt) {
          topicData.lastAttempt = session.completed_at;
        }

        // Add recommended lessons for this topic
        recommendedLessons
          .filter(lesson => lesson.topics_covered.includes(weakTopic.topic))
          .forEach(lesson => {
            topicData.recommendedLessons.set(lesson.lesson_id, {
              id: lesson.lesson_id,
              title: lesson.title,
              type: lesson.content_type === 'video' ? 'video' : 'text'
            });
          });
      });
    });

    // Convert map to array and calculate derived metrics
    return Array.from(topicMap.values()).map(topicData => {
      const errorRate = topicData.totalQuestions > 0 
        ? ((topicData.totalQuestions - topicData.correctAnswers) / topicData.totalQuestions) * 100
        : 0;

      const avgConfidenceScore = topicData.confidenceScores.length > 0
        ? topicData.confidenceScores.reduce((a, b) => a + b, 0) / topicData.confidenceScores.length
        : 0;

      return {
        topic: topicData.topic,
        subject: topicData.subject,
        totalQuestions: topicData.totalQuestions,
        correctAnswers: topicData.correctAnswers,
        errorRate,
        confidenceScore: avgConfidenceScore,
        assessmentCount: topicData.assessmentCount,
        lastAttempt: topicData.lastAttempt,
        recommendedLessons: Array.from(topicData.recommendedLessons.values())
      };
    })
    .filter(topic => topic.totalQuestions > 0) // Only include topics with actual data
    .sort((a, b) => b.errorRate - a.errorRate); // Sort by error rate (worst first)
  },

  // Get topic performance for a specific subject
  async getSubjectTopicPerformance(subject: string): Promise<TopicPerformanceData[]> {
    const allTopics = await this.getUserTopicPerformance();
    return allTopics.filter(topic => topic.subject === subject);
  },

  // Get the worst performing topics across all subjects
  async getWorstPerformingTopics(limit: number = 10): Promise<TopicPerformanceData[]> {
    const allTopics = await this.getUserTopicPerformance();
    return allTopics
      .filter(topic => topic.errorRate > 25) // Only topics with significant error rates
      .slice(0, limit);
  }
};
