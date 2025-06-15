
import { supabase } from '@/integrations/supabase/client';
import { assessmentImprovementService, WeakTopic, RecommendedLesson } from './assessmentImprovementService';
import { TopicPerformanceData } from '@/components/learningHub/TopicPerformanceHeatMap';

// Topic mapping system to group related keywords under broader topics
const TOPIC_MAPPINGS = {
  // Biology topics
  'Microscopes': [
    'microscope', 'microscopy', 'magnification', 'resolution', 'objective lens', 
    'eyepiece', 'stage', 'slide', 'stage clips', 'focus knob', 'coarse focus', 
    'fine focus', 'light microscope', 'electron microscope', 'staining'
  ],
  'Cell Biology': [
    'cell', 'cells', 'membrane', 'nucleus', 'cytoplasm', 'organelle', 'organelles',
    'mitochondria', 'chloroplast', 'vacuole', 'cell wall', 'cell membrane'
  ],
  'Enzymes': [
    'enzyme', 'enzymes', 'active site', 'substrate', 'catalyst', 'protein',
    'denatured', 'optimum temperature', 'optimum ph'
  ],
  'Respiration': [
    'respiration', 'cellular respiration', 'aerobic', 'anaerobic', 'glucose',
    'oxygen', 'carbon dioxide', 'atp', 'energy'
  ],
  'Photosynthesis': [
    'photosynthesis', 'chlorophyll', 'light reaction', 'carbon fixation',
    'glucose production', 'sunlight', 'water', 'carbon dioxide'
  ],
  'Genetics': [
    'genetics', 'dna', 'genes', 'chromosomes', 'inheritance', 'alleles',
    'dominant', 'recessive', 'genotype', 'phenotype'
  ],
  'Evolution': [
    'evolution', 'natural selection', 'adaptation', 'variation', 'mutation',
    'species', 'fossil', 'darwin'
  ],
  'Ecology': [
    'ecology', 'ecosystem', 'food chain', 'food web', 'predator', 'prey',
    'population', 'community', 'habitat', 'biodiversity'
  ],
  'Cell Division': [
    'mitosis', 'meiosis', 'cell division', 'chromosome', 'sister chromatids',
    'spindle fibers', 'cytokinesis'
  ],
  
  // Mathematics topics
  'Algebra': [
    'algebra', 'equations', 'variables', 'linear', 'quadratic', 'polynomial',
    'factoring', 'solving', 'x', 'y'
  ],
  'Geometry': [
    'geometry', 'shapes', 'angles', 'triangles', 'circles', 'area', 'perimeter',
    'volume', 'surface area', 'coordinate geometry'
  ],
  'Statistics': [
    'statistics', 'mean', 'median', 'mode', 'range', 'data', 'graphs',
    'probability', 'frequency', 'distribution'
  ],
  'Calculus': [
    'calculus', 'derivatives', 'integrals', 'limits', 'differentiation',
    'integration', 'rate of change'
  ],
  'Fractions': [
    'fractions', 'numerator', 'denominator', 'mixed numbers', 'improper fractions',
    'equivalent fractions', 'simplifying'
  ],
  'Percentages': [
    'percentages', 'percent', '%', 'decimal', 'proportion', 'ratio'
  ]
};

// Reverse mapping for quick lookup
const KEYWORD_TO_TOPIC: Record<string, string> = {};
Object.entries(TOPIC_MAPPINGS).forEach(([topic, keywords]) => {
  keywords.forEach(keyword => {
    KEYWORD_TO_TOPIC[keyword.toLowerCase()] = topic;
  });
});

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

    // Try to get improvement data first
    const sessionIds = sessions.map(s => s.id);
    const { data: improvements, error: improvementsError } = await supabase
      .from('assessment_improvements')
      .select('*')
      .in('session_id', sessionIds);

    if (improvementsError) throw improvementsError;

    // If we have improvement data, use the existing logic
    if (improvements && improvements.length > 0) {
      return this.buildTopicDataFromImprovements(sessions, improvements);
    }

    // If no improvement data exists, extract directly from student responses
    console.log('No improvement data found, extracting from student responses...');
    return this.buildTopicDataFromResponses(sessions);
  },

  // Build topic data from existing improvement records
  buildTopicDataFromImprovements(sessions: any[], improvements: any[]): TopicPerformanceData[] {
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
        // Map the topic to broader category
        const mappedTopic = this.mapToTopicCategory(weakTopic.topic, session.ai_assessments.subject);
        const key = `${mappedTopic}_${session.ai_assessments.subject}`;
        
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            topic: mappedTopic,
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

    return this.convertTopicMapToArray(topicMap);
  },

  // Build topic data directly from student responses when improvement data is missing
  async buildTopicDataFromResponses(sessions: any[]): Promise<TopicPerformanceData[]> {
    const sessionIds = sessions.map(s => s.id);

    // Get all student responses with question details
    const { data: responses, error: responsesError } = await supabase
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
      .in('session_id', sessionIds);

    if (responsesError) throw responsesError;
    if (!responses || responses.length === 0) return [];

    const topicMap = new Map<string, {
      topic: string;
      subject: string;
      totalQuestions: number;
      correctAnswers: number;
      assessmentCount: number;
      confidenceScores: number[];
      lastAttempt: string;
      recommendedLessons: Array<{ id: string; title: string; type: 'video' | 'text' }>;
    }>();

    // Process each response and extract topics from keywords
    responses.forEach(response => {
      const session = sessions.find(s => s.id === response.session_id);
      if (!session || !response.assessment_questions) return;

      const question = response.assessment_questions;
      const subject = session.ai_assessments?.subject || 'Unknown';
      const isCorrect = response.marks_awarded >= question.marks_available;
      const confidenceScore = response.confidence_score || 5;

      // Extract and map topics from keywords and question content
      const topics = this.extractAndMapTopics(question, response, subject);

      topics.forEach(topic => {
        const key = `${topic}_${subject}`;
        
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            topic,
            subject,
            totalQuestions: 0,
            correctAnswers: 0,
            assessmentCount: 1,
            confidenceScores: [],
            lastAttempt: session.completed_at || '',
            recommendedLessons: []
          });
        }

        const topicData = topicMap.get(key)!;
        topicData.totalQuestions += 1;
        if (isCorrect) topicData.correctAnswers += 1;
        topicData.confidenceScores.push(confidenceScore);

        // Update last attempt if this session is more recent
        if (session.completed_at && session.completed_at > topicData.lastAttempt) {
          topicData.lastAttempt = session.completed_at;
        }
      });
    });

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
        recommendedLessons: topicData.recommendedLessons
      };
    })
    .filter(topic => topic.totalQuestions > 0)
    .sort((a, b) => b.errorRate - a.errorRate);
  },

  // Map individual keywords/topics to broader categories
  mapToTopicCategory(rawTopic: string, subject: string): string {
    const normalized = rawTopic.toLowerCase().trim();
    
    // Check direct mapping first
    if (KEYWORD_TO_TOPIC[normalized]) {
      return KEYWORD_TO_TOPIC[normalized];
    }

    // Check for partial matches in topic mappings
    for (const [topicCategory, keywords] of Object.entries(TOPIC_MAPPINGS)) {
      if (keywords.some(keyword => 
        normalized.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(normalized)
      )) {
        return topicCategory;
      }
    }

    // If no mapping found, capitalize and return the original
    return rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1);
  },

  // Extract and map topics from question data with improved categorization
  extractAndMapTopics(question: any, response: any, subject: string): string[] {
    const rawTopics = new Set<string>();

    // Add keywords as topics
    if (Array.isArray(question.keywords)) {
      question.keywords.forEach(keyword => {
        if (typeof keyword === 'string' && keyword.length > 2) {
          rawTopics.add(keyword.toLowerCase());
        }
      });
    }

    // Extract topics from AI feedback if available
    if (response.ai_feedback) {
      const feedback = response.ai_feedback.toLowerCase();
      
      // Look for topic mappings in feedback
      Object.entries(TOPIC_MAPPINGS).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => feedback.includes(keyword.toLowerCase()))) {
          rawTopics.add(topic);
        }
      });
    }

    // Extract from question text
    const questionText = question.question_text.toLowerCase();
    Object.entries(TOPIC_MAPPINGS).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => questionText.includes(keyword.toLowerCase()))) {
        rawTopics.add(topic);
      }
    });

    // Map raw topics to categories and remove duplicates
    const mappedTopics = new Set<string>();
    rawTopics.forEach(rawTopic => {
      const mappedTopic = this.mapToTopicCategory(rawTopic, subject);
      mappedTopics.add(mappedTopic);
    });

    return Array.from(mappedTopics);
  },

  // Convert topic map to array with calculated metrics
  convertTopicMapToArray(topicMap: Map<string, any>): TopicPerformanceData[] {
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
        recommendedLessons: Array.from(topicData.recommendedLessons?.values() || [])
      };
    })
    .filter(topic => topic.totalQuestions > 0)
    .sort((a, b) => b.errorRate - a.errorRate);
  },

  // Generate missing improvement data for existing sessions
  async generateMissingImprovements(): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get completed sessions without improvement data
    const { data: sessions } = await supabase
      .from('assessment_sessions')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null);

    if (!sessions) return;

    const { data: existingImprovements } = await supabase
      .from('assessment_improvements')
      .select('session_id')
      .in('session_id', sessions.map(s => s.id));

    const existingSessionIds = new Set(existingImprovements?.map(i => i.session_id) || []);
    const missingSessions = sessions.filter(s => !existingSessionIds.has(s.id));

    console.log(`Found ${missingSessions.length} sessions without improvement data`);

    // Generate improvement data for missing sessions
    for (const session of missingSessions) {
      try {
        await assessmentImprovementService.generateImprovements(session.id);
        console.log(`Generated improvement data for session ${session.id}`);
      } catch (error) {
        console.error(`Failed to generate improvement for session ${session.id}:`, error);
      }
    }
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
      .filter(topic => topic.errorRate > 25)
      .slice(0, limit);
  }
};
