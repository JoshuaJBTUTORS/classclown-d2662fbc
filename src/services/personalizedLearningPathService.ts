import { supabase } from '@/integrations/supabase/client';
import { CourseModule } from '@/types/course';
import { aiAssessmentService } from './aiAssessmentService';

interface QuestionModuleMapping {
  [questionNumber: number]: string; // module_id
}

interface ModuleStruggleAnalysis {
  moduleId: string;
  moduleName: string;
  position: number;
  struggleScore: number;
  questionsAnalyzed: number;
  questionsStruggled: number;
  averagePerformance: number;
}

interface PersonalizedModuleOrder {
  modules: CourseModule[];
  isPersonalized: boolean;
  reason?: string;
}

// Biology question-to-module mapping based on your specification
const BIOLOGY_QUESTION_MODULE_MAPPING: QuestionModuleMapping = {
  1: 'cell-biology', // Cell Biology Module 2
  2: 'cell-biology', // Cell Biology Module 2  
  3: 'cell-biology', // Cell Biology Module 2
  4: 'organisation', // Organisation Module 3
  5: 'infection-response', // Infection and Response Module 4
  6: 'infection-response', // Infection and Response Module 4
  7: 'bioenergetics', // Bioenergetics Module 5
  8: 'bioenergetics', // Bioenergetics Module 6
  9: 'homeostasis-response', // Homeostasis & Response Module 7
  10: 'homeostasis-response', // Homeostasis & Response Module 7
  11: 'inheritance-variation-evolution', // Inheritance, Variation and Evolution Module 8
  12: 'inheritance-variation-evolution', // Inheritance, Variation and Evolution Module 8
  13: 'ecology', // Ecology Module 9
  14: 'ecology', // Ecology Module 9
};

// Map module names to topic keywords for matching
const MODULE_TOPIC_MAPPING: { [key: string]: string[] } = {
  'getting-started': ['getting', 'started', 'introduction', 'intro', 'welcome', 'beginning'],
  'cell-biology': ['cell', 'biology', 'cellular', 'organelle', 'membrane', 'cytoplasm', 'nucleus'],
  'organisation': ['organisation', 'organization', 'tissue', 'organ', 'system', 'structure'],
  'infection-response': ['infection', 'response', 'immune', 'disease', 'pathogen', 'antibody'],
  'bioenergetics': ['bioenergetics', 'energy', 'respiration', 'photosynthesis', 'metabolism'],
  'homeostasis-response': ['homeostasis', 'response', 'nervous', 'hormonal', 'regulation'],
  'inheritance-variation-evolution': ['inheritance', 'variation', 'evolution', 'genetics', 'dna', 'genes'],
  'ecology': ['ecology', 'environment', 'ecosystem', 'food chain', 'biodiversity']
};

export const personalizedLearningPathService = {
  /**
   * Get personalized module order for a student based on assessment performance
   */
  getPersonalizedModuleOrder: async (
    courseId: string, 
    modules: CourseModule[],
    userId?: string
  ): Promise<PersonalizedModuleOrder> => {
    try {
      if (!userId) {
        return { modules, isPersonalized: false, reason: 'No user authenticated' };
      }

      // Find the "Getting Started" assessment for this course
      const gettingStartedAssessment = await personalizedLearningPathService.findGettingStartedAssessment(courseId);
      
      if (!gettingStartedAssessment) {
        return { modules, isPersonalized: false, reason: 'No Getting Started assessment found' };
      }

      // Get student's performance on the assessment
      const userSession = await aiAssessmentService.getUserSession(gettingStartedAssessment.id);
      
      if (!userSession || userSession.status !== 'completed') {
        return { modules, isPersonalized: false, reason: 'No completed assessment found' };
      }

      // Analyze student struggles
      const struggleAnalysis = await personalizedLearningPathService.analyzeStudentStruggles(
        userSession.id, 
        modules
      );

      if (struggleAnalysis.length === 0) {
        return { modules, isPersonalized: false, reason: 'No struggle data available' };
      }

      // Reorder modules based on struggle analysis
      const personalizedModules = personalizedLearningPathService.reorderModulesByStruggles(
        modules, 
        struggleAnalysis
      );

      return { 
        modules: personalizedModules, 
        isPersonalized: true, 
        reason: 'Personalized based on assessment performance' 
      };

    } catch (error) {
      console.error('Error creating personalized learning path:', error);
      return { modules, isPersonalized: false, reason: 'Error analyzing performance' };
    }
  },

  /**
   * Find the "Getting Started" assessment for a course
   */
  findGettingStartedAssessment: async (courseId: string) => {
    // Look for AI assessment lessons in the first module (Getting Started)
    const { data: modules, error: moduleError } = await supabase
      .from('course_modules')
      .select(`
        id,
        title,
        position,
        course_lessons (
          id,
          title,
          content_type,
          content_url,
          position
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .limit(1);

    if (moduleError || !modules?.[0]) {
      return null;
    }

    const firstModule = modules[0];
    const aiAssessmentLesson = firstModule.course_lessons?.find(
      lesson => lesson.content_type === 'ai-assessment'
    );

    if (!aiAssessmentLesson?.content_url) {
      return null;
    }

    // Extract assessment ID from content_url and get full assessment
    try {
      const assessmentId = aiAssessmentLesson.content_url;
      return await aiAssessmentService.getAssessmentById(assessmentId);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }
  },

  /**
   * Analyze student struggles based on assessment responses
   */
  analyzeStudentStruggles: async (
    sessionId: string, 
    modules: CourseModule[]
  ): Promise<ModuleStruggleAnalysis[]> => {
    try {
      // Get all student responses for this session
      const responses = await aiAssessmentService.getSessionResponses(sessionId);
      
      if (!responses || responses.length === 0) {
        return [];
      }

      // Group responses by module based on question number mapping
      const modulePerformance: { [moduleKey: string]: {
        responses: any[];
        moduleData: CourseModule;
      } } = {};

      // Initialize module performance tracking, but exclude "Getting Started"
      modules.forEach(module => {
        const moduleKey = personalizedLearningPathService.getModuleKeyFromModule(module);
        if (moduleKey && moduleKey !== 'getting-started') {
          modulePerformance[moduleKey] = {
            responses: [],
            moduleData: module
          };
        }
      });

      // Get assessment questions for question number mapping
      const { data: sessionData } = await supabase
        .from('assessment_sessions')
        .select('assessment_id')
        .eq('id', sessionId)
        .single();

      if (!sessionData?.assessment_id) {
        return [];
      }

      const { data: questions } = await supabase
        .from('assessment_questions')
        .select('id, question_number, marks_available')
        .eq('assessment_id', sessionData.assessment_id);

      const questionMap = new Map();
      if (questions) {
        questions.forEach((q: any) => {
          questionMap.set(q.id, q);
        });
      }

      // Categorize responses by module
      responses.forEach(response => {
        const question = questionMap.get(response.question_id);
        const questionNumber = question?.question_number;
        if (questionNumber && BIOLOGY_QUESTION_MODULE_MAPPING[questionNumber]) {
          const moduleKey = BIOLOGY_QUESTION_MODULE_MAPPING[questionNumber];
          if (modulePerformance[moduleKey]) {
            modulePerformance[moduleKey].responses.push({
              ...response,
              question
            });
          }
        }
      });

      // Calculate struggle scores for each module
      const struggleAnalysis: ModuleStruggleAnalysis[] = [];

      Object.entries(modulePerformance).forEach(([moduleKey, data]) => {
        if (data.responses.length === 0) return;

        const moduleResponses = data.responses;
        const totalQuestions = moduleResponses.length;
        let struggledQuestions = 0;
        let totalPerformance = 0;

        moduleResponses.forEach(response => {
          const performancePercentage = response.question?.marks_available > 0 
            ? (response.marks_awarded / response.question.marks_available) * 100 
            : 0;
          
          totalPerformance += performancePercentage;
          
          // Consider a question "struggled" if performance < 60%
          if (performancePercentage < 60) {
            struggledQuestions++;
          }
        });

        const averagePerformance = totalPerformance / totalQuestions;
        const struggleScore = (struggledQuestions / totalQuestions) * 100;

        struggleAnalysis.push({
          moduleId: data.moduleData.id,
          moduleName: data.moduleData.title,
          position: data.moduleData.position,
          struggleScore,
          questionsAnalyzed: totalQuestions,
          questionsStruggled: struggledQuestions,
          averagePerformance
        });
      });

      return struggleAnalysis.sort((a, b) => b.struggleScore - a.struggleScore);

    } catch (error) {
      console.error('Error analyzing student struggles:', error);
      return [];
    }
  },

  /**
   * Map a module to its topic key for question mapping
   */
  getModuleKeyFromModule: (module: CourseModule): string | null => {
    const moduleTitle = module.title.toLowerCase();
    
    // Try to match module title with topic keywords
    for (const [moduleKey, keywords] of Object.entries(MODULE_TOPIC_MAPPING)) {
      if (keywords.some(keyword => moduleTitle.includes(keyword))) {
        return moduleKey;
      }
    }
    
    return null;
  },

  /**
   * Reorder modules based on struggle analysis while respecting prerequisites
   */
  reorderModulesByStruggles: (
    originalModules: CourseModule[], 
    struggleAnalysis: ModuleStruggleAnalysis[]
  ): CourseModule[] => {
    // Create a copy of modules to avoid mutation
    const modules = [...originalModules].sort((a, b) => a.position - b.position);
    
    // Find "Getting Started" module by title keywords, not just position
    const isGettingStartedModule = (module: CourseModule): boolean => {
      const moduleKey = personalizedLearningPathService.getModuleKeyFromModule(module);
      return moduleKey === 'getting-started' || module.position === 0;
    };
    
    const gettingStartedModule = modules.find(isGettingStartedModule);
    const otherModules = modules.filter(m => !isGettingStartedModule(m));
    
    // Create struggle score map for quick lookup
    const struggleMap = new Map(
      struggleAnalysis.map(analysis => [analysis.moduleId, analysis.struggleScore])
    );
    
    // Sort other modules by struggle score (highest first), then by original position
    const prioritizedModules = otherModules.sort((a, b) => {
      const aStruggleScore = struggleMap.get(a.id) || 0;
      const bStruggleScore = struggleMap.get(b.id) || 0;
      
      // Primary sort: by struggle score (descending)
      if (aStruggleScore !== bStruggleScore) {
        return bStruggleScore - aStruggleScore;
      }
      
      // Secondary sort: by original position (ascending)
      return a.position - b.position;
    });
    
    // Reassemble the modules with Getting Started first
    const reorderedModules = gettingStartedModule 
      ? [gettingStartedModule, ...prioritizedModules]
      : prioritizedModules;
    
    // Update positions to maintain sequence - Getting Started stays at 0, others start from 1
    return reorderedModules.map((module, index) => ({
      ...module,
      position: gettingStartedModule && index === 0 ? 0 : (gettingStartedModule ? index : index + 1)
    }));
  },

  /**
   * Cache personalized path for performance
   */
  cachePersonalizedPath: async (
    userId: string, 
    courseId: string, 
    personalizedOrder: PersonalizedModuleOrder
  ): Promise<void> => {
    try {
      const cacheKey = `personalized_path_${userId}_${courseId}`;
      const cacheData = {
        ...personalizedOrder,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      // Store in localStorage for now (could be moved to database for persistence)
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching personalized path:', error);
    }
  },

  /**
   * Get cached personalized path
   */
  getCachedPersonalizedPath: async (
    userId: string, 
    courseId: string
  ): Promise<PersonalizedModuleOrder | null> => {
    try {
      const cacheKey = `personalized_path_${userId}_${courseId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const expiresAt = new Date(cacheData.expiresAt);
      
      if (expiresAt < new Date()) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return {
        modules: cacheData.modules,
        isPersonalized: cacheData.isPersonalized,
        reason: cacheData.reason
      };
    } catch (error) {
      console.error('Error getting cached personalized path:', error);
      return null;
    }
  }
};
