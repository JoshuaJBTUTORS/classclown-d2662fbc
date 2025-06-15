import { supabase } from '@/integrations/supabase/client';

export interface WeakTopic {
  topic: string;
  questions_missed: number;
  total_questions: number;
  confidence_score: number;
  description: string;
}

export interface RecommendedLesson {
  lesson_id: string;
  title: string;
  module_title: string;
  content_type: string;
  relevance_score: number;
  topics_covered: string[];
}

export interface AssessmentImprovement {
  id: string;
  session_id: string;
  user_id: string;
  weak_topics: WeakTopic[];
  recommended_lessons: RecommendedLesson[];
  improvement_summary: string;
  created_at: string;
  updated_at: string;
}

export const assessmentImprovementService = {
  // Generate improvement recommendations for a completed assessment session
  async generateImprovements(sessionId: string): Promise<AssessmentImprovement> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get session details and responses
    const { data: session } = await supabase
      .from('assessment_sessions')
      .select(`
        *,
        ai_assessments(id, title, subject)
      `)
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Assessment session not found');

    // Get all responses for this session with question details
    const { data: responses } = await supabase
      .from('student_responses')
      .select(`
        *,
        assessment_questions(
          id,
          question_text,
          keywords,
          marks_available,
          correct_answer,
          question_type
        )
      `)
      .eq('session_id', sessionId);

    if (!responses) return this.createEmptyImprovement(sessionId, user.user.id);

    // Analyze weak topics from incorrect responses
    const weakTopics = this.analyzeWeakTopics(responses);
    
    // Get course content recommendations
    const recommendedLessons = await this.getRecommendedLessons(
      weakTopics, 
      session.ai_assessments?.subject
    );

    // Generate improvement summary
    const improvementSummary = this.generateImprovementSummary(weakTopics, recommendedLessons);

    // Store in database
    const { data, error } = await supabase
      .from('assessment_improvements')
      .insert({
        session_id: sessionId,
        user_id: user.user.id,
        weak_topics: weakTopics,
        recommended_lessons: recommendedLessons,
        improvement_summary: improvementSummary
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      weak_topics: (data.weak_topics as unknown) as WeakTopic[],
      recommended_lessons: (data.recommended_lessons as unknown) as RecommendedLesson[]
    } as AssessmentImprovement;
  },

  // Get existing improvement recommendations for a session
  async getImprovements(sessionId: string): Promise<AssessmentImprovement | null> {
    const { data, error } = await supabase
      .from('assessment_improvements')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    return {
      ...data,
      weak_topics: (data.weak_topics as unknown) as WeakTopic[],
      recommended_lessons: (data.recommended_lessons as unknown) as RecommendedLesson[]
    } as AssessmentImprovement;
  },

  // Analyze incorrect responses to identify weak topics
  analyzeWeakTopics(responses: any[]): WeakTopic[] {
    const topicMap = new Map<string, {
      missed: number;
      total: number;
      confidenceScores: number[];
      descriptions: Set<string>;
    }>();

    responses.forEach(response => {
      if (!response.assessment_questions) return;

      const question = response.assessment_questions;
      const keywords = Array.isArray(question.keywords) ? question.keywords : [];
      const isIncorrect = response.marks_awarded < question.marks_available;
      const confidenceScore = response.confidence_score || 0;

      // Extract topics from keywords and question analysis
      const topics = this.extractTopicsFromQuestion(question, response.marking_breakdown);

      topics.forEach(topic => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            missed: 0,
            total: 0,
            confidenceScores: [],
            descriptions: new Set()
          });
        }

        const topicData = topicMap.get(topic)!;
        topicData.total++;
        topicData.confidenceScores.push(confidenceScore);

        if (isIncorrect) {
          topicData.missed++;
        }

        // Add description from AI feedback if available
        if (response.ai_feedback) {
          topicData.descriptions.add(response.ai_feedback.substring(0, 200));
        }
      });
    });

    // Convert to WeakTopic array, focusing on topics with poor performance
    return Array.from(topicMap.entries())
      .filter(([_, data]) => data.missed > 0 && (data.missed / data.total) >= 0.3)
      .map(([topic, data]) => ({
        topic,
        questions_missed: data.missed,
        total_questions: data.total,
        confidence_score: data.confidenceScores.reduce((a, b) => a + b, 0) / data.confidenceScores.length,
        description: Array.from(data.descriptions).join(' ')
      }))
      .sort((a, b) => (b.questions_missed / b.total_questions) - (a.questions_missed / a.total_questions));
  },

  // Extract topics from question data and AI analysis
  extractTopicsFromQuestion(question: any, markingBreakdown: any): string[] {
    const topics: string[] = [];

    // Add keywords as topics
    if (Array.isArray(question.keywords)) {
      topics.push(...question.keywords.map(k => String(k)));
    }

    // Extract topics from AI marking breakdown
    if (markingBreakdown && markingBreakdown.topics) {
      topics.push(...markingBreakdown.topics);
    }

    // Extract topics from question text using simple keyword matching
    const questionText = question.question_text.toLowerCase();
    const commonTopics = [
      'algebra', 'geometry', 'calculus', 'statistics', 'probability',
      'fractions', 'decimals', 'percentages', 'equations', 'graphs',
      'biology', 'chemistry', 'physics', 'genetics', 'ecology',
      'grammar', 'vocabulary', 'literature', 'writing', 'reading',
      'history', 'geography', 'politics', 'economics', 'sociology'
    ];

    commonTopics.forEach(topic => {
      if (questionText.includes(topic)) {
        topics.push(topic);
      }
    });

    return [...new Set(topics)].filter(topic => topic.length > 0);
  },

  // Get recommended lessons based on weak topics
  async getRecommendedLessons(weakTopics: WeakTopic[], subject?: string): Promise<RecommendedLesson[]> {
    if (weakTopics.length === 0) return [];

    // Get all available course lessons that might be relevant
    let query = supabase
      .from('course_lessons')
      .select(`
        id,
        title,
        content_type,
        course_modules(title, course_id, courses(subject, title))
      `);

    // Filter by subject if available
    if (subject) {
      query = query.eq('course_modules.courses.subject', subject);
    }

    const { data: lessons } = await query;
    if (!lessons) return [];

    // Score lessons based on relevance to weak topics
    const scoredLessons = lessons.map(lesson => {
      let relevanceScore = 0;
      const topicsCovered: string[] = [];

      weakTopics.forEach(weakTopic => {
        const topicWords = weakTopic.topic.toLowerCase().split(' ');
        const lessonTitle = lesson.title.toLowerCase();

        // Check if lesson title contains topic keywords
        const titleMatch = topicWords.some(word => lessonTitle.includes(word));
        if (titleMatch) {
          relevanceScore += weakTopic.questions_missed * 2;
          topicsCovered.push(weakTopic.topic);
        }

        // Bonus for video content as it's often more engaging for struggling topics
        if (lesson.content_type === 'video') {
          relevanceScore += 1;
        }
      });

      return {
        lesson_id: lesson.id,
        title: lesson.title,
        module_title: lesson.course_modules?.title || '',
        content_type: lesson.content_type,
        relevance_score: relevanceScore,
        topics_covered: topicsCovered
      };
    })
    .filter(lesson => lesson.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 6); // Limit to top 6 recommendations

    return scoredLessons;
  },

  // Generate a summary of improvement recommendations
  generateImprovementSummary(weakTopics: WeakTopic[], recommendedLessons: RecommendedLesson[]): string {
    if (weakTopics.length === 0) {
      return "Great job! No significant areas for improvement identified.";
    }

    const topWeakTopic = weakTopics[0];
    const videoRecommendations = recommendedLessons.filter(l => l.content_type === 'video').length;

    let summary = `Based on your assessment, you should focus on improving ${topWeakTopic.topic}`;
    
    if (weakTopics.length > 1) {
      summary += ` and ${weakTopics.length - 1} other topic${weakTopics.length > 2 ? 's' : ''}`;
    }

    summary += `. `;

    if (recommendedLessons.length > 0) {
      summary += `We've identified ${recommendedLessons.length} relevant lesson${recommendedLessons.length > 1 ? 's' : ''} to review`;
      
      if (videoRecommendations > 0) {
        summary += `, including ${videoRecommendations} video${videoRecommendations > 1 ? 's' : ''} that can help clarify these concepts`;
      }
      
      summary += `.`;
    }

    return summary;
  },

  // Create empty improvement for sessions with no weak areas
  createEmptyImprovement(sessionId: string, userId: string): AssessmentImprovement {
    return {
      id: '',
      session_id: sessionId,
      user_id: userId,
      weak_topics: [],
      recommended_lessons: [],
      improvement_summary: "Excellent work! No significant areas for improvement identified.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
