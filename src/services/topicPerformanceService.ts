import { supabase } from '@/integrations/supabase/client';
import { assessmentImprovementService, WeakTopic, RecommendedLesson } from './assessmentImprovementService';
import { TopicPerformanceData } from '@/components/learningHub/TopicPerformanceHeatMap';

// Cache for module data to avoid repeated database calls
let moduleCache: Record<string, string[]> = {};
let moduleCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const topicPerformanceService = {
  // Get available modules for a specific subject
  async getSubjectModules(subject: string): Promise<string[]> {
    const now = Date.now();
    const cacheKey = subject.toLowerCase();
    
    // Check if we have fresh cached data
    if (moduleCache[cacheKey] && (now - moduleCacheTimestamp) < CACHE_DURATION) {
      return moduleCache[cacheKey];
    }

    try {
      const { data: modules, error } = await supabase
        .from('course_modules')
        .select('title, courses(subject)')
        .eq('courses.subject', subject);

      if (error) throw error;

      const moduleNames = modules?.map(m => m.title).filter(Boolean) || [];
      
      // Update cache
      moduleCache[cacheKey] = moduleNames;
      moduleCacheTimestamp = now;
      
      return moduleNames;
    } catch (error) {
      console.error('Error fetching subject modules:', error);
      return [];
    }
  },

  // Get aggregated topic performance data for the current user with optional course filtering
  async getUserTopicPerformance(courseId?: string): Promise<TopicPerformanceData[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = supabase
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

    // If courseId is provided, filter by course
    if (courseId) {
      // Get assessments for the specific course by matching subject
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('subject')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      if (!course) return [];

      // Filter sessions by course subject
      const { data: sessions, error: sessionsError } = await query;
      if (sessionsError) throw sessionsError;

      const filteredSessions = sessions?.filter(session => 
        session.ai_assessments?.subject === course.subject
      ) || [];

      return this.processSessionsForTopicPerformance(filteredSessions);
    }

    // Get all completed assessment sessions for the user
    const { data: sessions, error: sessionsError } = await query;
    if (sessionsError) throw sessionsError;
    if (!sessions || sessions.length === 0) return [];

    return this.processSessionsForTopicPerformance(sessions);
  },

  // Process sessions for topic performance (extracted from getUserTopicPerformance)
  async processSessionsForTopicPerformance(sessions: any[]): Promise<TopicPerformanceData[]> {
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
  async buildTopicDataFromImprovements(sessions: any[], improvements: any[]): Promise<TopicPerformanceData[]> {
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
    for (const improvement of improvements) {
      const session = sessions.find(s => s.id === improvement.session_id);
      if (!session || !session.ai_assessments?.subject) continue;

      const weakTopics = (improvement.weak_topics as unknown) as WeakTopic[];
      const recommendedLessons = (improvement.recommended_lessons as unknown) as RecommendedLesson[];

      for (const weakTopic of weakTopics) {
        // Map the topic to broader category using subject-specific modules
        const mappedTopic = await this.mapToTopicCategory(weakTopic.topic, session.ai_assessments.subject);
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
        if (Array.isArray(recommendedLessons)) {
          recommendedLessons
            .filter(lesson => Array.isArray(lesson.topics_covered) && lesson.topics_covered.includes(weakTopic.topic))
            .forEach(lesson => {
              topicData.recommendedLessons.set(lesson.lesson_id, {
                id: lesson.lesson_id,
                title: lesson.title,
                type: lesson.content_type === 'video' ? 'video' : 'text'
              });
            });
        }
      }
    }

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
      recommendedLessons: { id: string; title: string; type: 'video' | 'text' }[];
    }>();

    // Process each response and extract topics from keywords
    for (const response of responses) {
      const session = sessions.find(s => s.id === response.session_id);
      if (!session || !response.assessment_questions) continue;

      const question = response.assessment_questions;
      const subject = session.ai_assessments?.subject || 'Unknown';
      
      // Fix the isCorrect calculation with proper type safety
      const marksAwarded = Number(response.marks_awarded) || 0;
      const marksAvailable = Number(question.marks_available) || 1;
      const isCorrect = marksAwarded >= marksAvailable;
      
      console.log('Question scoring:', {
        questionId: question.id,
        marksAwarded,
        marksAvailable,
        isCorrect
      });
      
      const confidenceScore = response.confidence_score || 5;

      // Extract and map topics from keywords and question content
      const topics = await this.extractAndMapTopics(question, response, subject);

      for (const topic of topics) {
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
            recommendedLessons: [] as { id: string; title: string; type: 'video' | 'text' }[]
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
      }
    }

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
        recommendedLessons: topicData.recommendedLessons as { id: string; title: string; type: 'video' | 'text' }[]
      };
    })
    .filter(topic => topic.totalQuestions > 0)
    .sort((a, b) => b.errorRate - a.errorRate);
  },

  // Map individual keywords/topics to broader categories using subject-specific modules
  async mapToTopicCategory(rawTopic: string, subject: string): Promise<string> {
    const normalized = rawTopic.toLowerCase().trim();
    
    // Get modules for this specific subject
    const subjectModules = await this.getSubjectModules(subject);
    
    // Check for direct matches with module names
    for (const moduleName of subjectModules) {
      const moduleWords = moduleName.toLowerCase().split(' ');
      const topicWords = normalized.split(' ');
      
      // Check if the topic contains any of the module words or vice versa
      if (moduleWords.some(word => normalized.includes(word)) || 
          topicWords.some(word => moduleName.toLowerCase().includes(word))) {
        return moduleName;
      }
    }

    // Create subject-specific keyword mappings based on available modules
    const keywordMappings = this.createSubjectSpecificMappings(subjectModules, subject);
    
    // Check keyword mappings
    for (const [module, keywords] of Object.entries(keywordMappings)) {
      if (Array.isArray(keywords) && keywords.some((keyword: string) => 
        normalized.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(normalized)
      )) {
        return module;
      }
    }

    // If no mapping found, capitalize and return the original
    return rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1);
  },

  // Create subject-specific keyword mappings based on available modules
  createSubjectSpecificMappings(modules: string[], subject: string): Record<string, string[]> {
    const mappings: Record<string, string[]> = {};
    
    // Create mappings based on actual modules for this subject
    modules.forEach(module => {
      const moduleKey = module;
      const moduleLower = module.toLowerCase();
      
      // Biology-specific mappings
      if (subject.toLowerCase().includes('biology') || subject.toLowerCase().includes('science')) {
        if (moduleLower.includes('microscope') || moduleLower.includes('cell')) {
          mappings[moduleKey] = [
            'microscope', 'microscopy', 'magnification', 'resolution', 'objective lens', 
            'eyepiece', 'stage', 'slide', 'stage clips', 'focus knob', 'coarse focus', 
            'fine focus', 'light microscope', 'electron microscope', 'staining',
            'cell', 'cells', 'membrane', 'nucleus', 'cytoplasm', 'organelle', 'organelles',
            'mitochondria', 'chloroplast', 'vacuole', 'cell wall', 'cell membrane'
          ];
        } else if (moduleLower.includes('enzyme')) {
          mappings[moduleKey] = [
            'enzyme', 'enzymes', 'active site', 'substrate', 'catalyst', 'protein',
            'denatured', 'optimum temperature', 'optimum ph'
          ];
        } else if (moduleLower.includes('respiration')) {
          mappings[moduleKey] = [
            'respiration', 'cellular respiration', 'aerobic', 'anaerobic', 'glucose',
            'oxygen', 'carbon dioxide', 'atp', 'energy'
          ];
        } else if (moduleLower.includes('photosynthesis')) {
          mappings[moduleKey] = [
            'photosynthesis', 'chlorophyll', 'light reaction', 'carbon fixation',
            'glucose production', 'sunlight', 'water', 'carbon dioxide'
          ];
        } else if (moduleLower.includes('genetic') || moduleLower.includes('inheritance')) {
          mappings[moduleKey] = [
            'genetics', 'dna', 'genes', 'chromosomes', 'inheritance', 'alleles',
            'dominant', 'recessive', 'genotype', 'phenotype'
          ];
        } else if (moduleLower.includes('evolution')) {
          mappings[moduleKey] = [
            'evolution', 'natural selection', 'adaptation', 'variation', 'mutation',
            'species', 'fossil', 'darwin'
          ];
        } else if (moduleLower.includes('ecology') || moduleLower.includes('ecosystem')) {
          mappings[moduleKey] = [
            'ecology', 'ecosystem', 'food chain', 'food web', 'predator', 'prey',
            'population', 'community', 'habitat', 'biodiversity'
          ];
        }
      }
      
      // Mathematics-specific mappings
      if (subject.toLowerCase().includes('math') || subject.toLowerCase().includes('maths')) {
        if (moduleLower.includes('algebra')) {
          mappings[moduleKey] = [
            'algebra', 'equations', 'variables', 'linear', 'quadratic', 'polynomial',
            'factoring', 'solving', 'x', 'y'
          ];
        } else if (moduleLower.includes('geometry')) {
          mappings[moduleKey] = [
            'geometry', 'shapes', 'angles', 'triangles', 'circles', 'area', 'perimeter',
            'volume', 'surface area', 'coordinate geometry'
          ];
        } else if (moduleLower.includes('statistic') || moduleLower.includes('probability')) {
          mappings[moduleKey] = [
            'statistics', 'mean', 'median', 'mode', 'range', 'data', 'graphs',
            'probability', 'frequency', 'distribution'
          ];
        } else if (moduleLower.includes('calculus')) {
          mappings[moduleKey] = [
            'calculus', 'derivatives', 'integrals', 'limits', 'differentiation',
            'integration', 'rate of change'
          ];
        } else if (moduleLower.includes('fraction')) {
          mappings[moduleKey] = [
            'fractions', 'numerator', 'denominator', 'mixed numbers', 'improper fractions',
            'equivalent fractions', 'simplifying'
          ];
        } else if (moduleLower.includes('percentage') || moduleLower.includes('ratio')) {
          mappings[moduleKey] = [
            'percentages', 'percent', '%', 'decimal', 'proportion', 'ratio'
          ];
        }
      }
    });
    
    return mappings;
  },

  // Extract and map topics from question data with subject-specific categorization
  async extractAndMapTopics(question: any, response: any, subject: string): Promise<string[]> {
    const rawTopics = new Set<string>();

    // Add keywords as topics (with proper type checking)
    if (question.keywords && Array.isArray(question.keywords)) {
      question.keywords.forEach((keyword: unknown) => {
        if (typeof keyword === 'string' && keyword.length > 2) {
          rawTopics.add(keyword.toLowerCase());
        }
      });
    }

    // Extract topics from AI feedback if available
    if (response.ai_feedback) {
      const feedback = response.ai_feedback.toLowerCase();
      
      // Get subject-specific modules and their keywords
      const subjectModules = await this.getSubjectModules(subject);
      const keywordMappings = this.createSubjectSpecificMappings(subjectModules, subject);
      
      // Look for module-specific keywords in feedback
      Object.entries(keywordMappings).forEach(([module, keywords]) => {
        if (Array.isArray(keywords) && keywords.some(keyword => feedback.includes(keyword.toLowerCase()))) {
          rawTopics.add(module);
        }
      });
    }

    // Extract from question text using subject-specific approach
    const questionText = question.question_text.toLowerCase();
    const subjectModules = await this.getSubjectModules(subject);
    const keywordMappings = this.createSubjectSpecificMappings(subjectModules, subject);
    
    Object.entries(keywordMappings).forEach(([module, keywords]) => {
      if (Array.isArray(keywords) && keywords.some(keyword => questionText.includes(keyword.toLowerCase()))) {
        rawTopics.add(module);
      }
    });

    // Map raw topics to categories and remove duplicates
    const mappedTopics = new Set<string>();
    for (const rawTopic of rawTopics) {
      const mappedTopic = await this.mapToTopicCategory(rawTopic, subject);
      mappedTopics.add(mappedTopic);
    }

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
        recommendedLessons: Array.from(topicData.recommendedLessons?.values() || []) as { id: string; title: string; type: 'video' | 'text' }[]
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

  // Get the worst performing topics across all subjects or for a specific course
  async getWorstPerformingTopics(limit: number = 10, courseId?: string): Promise<TopicPerformanceData[]> {
    const allTopics = await this.getUserTopicPerformance(courseId);
    return allTopics
      .filter(topic => topic.errorRate > 25)
      .slice(0, limit);
  }
};
