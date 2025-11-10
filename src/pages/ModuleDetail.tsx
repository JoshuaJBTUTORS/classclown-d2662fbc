import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { usePersonalizedLearningPath } from '@/hooks/usePersonalizedLearningPath';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import AssessmentNavigation from '@/components/learningHub/AssessmentNavigation';
import ModuleAssessmentDialog from '@/components/learningHub/ModuleAssessmentDialog';
import AssessmentTimeScreen from '@/components/learningHub/AssessmentTimeScreen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen,
  CheckCircle,
  Play,
  Trophy,
  Bot,
  Mic
} from 'lucide-react';
import { CleoChat } from '@/components/cleo/CleoChat';
import { TopicSelectionScreen } from '@/components/cleo/TopicSelectionScreen';
import { getTopicsForSubject } from '@/constants/cleoTopics';

const ModuleDetail = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { isOwner, user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const learningMode = 'cleo'; // Always use Voice Tutor mode

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => learningHubService.getCourseModules(courseId!),
    enabled: !!courseId,
  });

  // Get personalized module order for navigation
  const { data: personalizedOrder } = usePersonalizedLearningPath({
    courseId: courseId!,
    modules: modules || [],
    enabled: !!courseId && !!modules
  });

  // Use personalized modules for navigation or fallback to original
  const orderedModules = personalizedOrder?.modules || modules;

  const { data: hasPurchased } = useQuery({
    queryKey: ['course-purchase', courseId],
    queryFn: () => paymentService.checkCoursePurchase(courseId!),
    enabled: !!courseId && !isOwner,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', moduleId],
    queryFn: () => learningHubService.getStudentProgress(),
    enabled: !!moduleId,
  });

  const { data: moduleAssessments } = useQuery({
    queryKey: ['module-assessments', moduleId],
    queryFn: () => learningHubService.getModuleAssessments(moduleId!),
    enabled: !!moduleId,
  });

  // All modules always accessible - sequential access removed
  const { data: canProgressToNext } = useQuery({
    queryKey: ['can-progress', moduleId],
    queryFn: async () => {
      return true; // All modules always accessible
    },
    enabled: !!orderedModules && !!moduleId,
  });

  const { data: isAssessmentCompleted } = useQuery({
    queryKey: ['assessment-completed', moduleId],
    queryFn: () => learningHubService.isModuleAssessmentCompleted(moduleId!),
    enabled: !!moduleId,
  });

  // All modules always accessible - sequential access removed
  const { data: hasModuleAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['module-access', moduleId],
    queryFn: () => {
      return true; // All modules always accessible
    },
    enabled: !!moduleId,
  });

  const currentModule = orderedModules?.find(m => m.id === moduleId);
  const allLessons = currentModule?.lessons || [];
  
  // All lessons are now for Cleo (ai-assessment type)
  const lessons = allLessons;
  
  const currentLesson = lessons[currentLessonIndex];
  const hasAccess = isOwner || hasPurchased;

  // Add class to root for full-width
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('learning-hub-page');
    }
    return () => {
      const root = document.getElementById('root');
      if (root) {
        root.classList.remove('learning-hub-page');
      }
    };
  }, []);

  // Reset lesson index when module changes
  useEffect(() => {
    setCurrentLessonIndex(0);
  }, [moduleId]);

  const handleBackToCourse = () => {
    navigate(`/course/${courseId}`);
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else {
      // At the end of lessons - check for module assessments
      if (hasRequiredAssessment && !isAssessmentCompleted) {
        // Show assessment time screen instead of navigating
        setCurrentLessonIndex(lessons.length);
        return;
      }
      
      // No assessments, proceed to next module
      const currentModuleIndex = orderedModules?.findIndex(m => m.id === moduleId) || 0;
      const nextModule = orderedModules?.[currentModuleIndex + 1];
      if (nextModule) {
        navigate(`/course/${courseId}/module/${nextModule.id}`);
      } else {
        navigate(`/course/${courseId}`);
      }
    }
  };

  const handleTakeAssessment = () => {
    setShowAssessmentDialog(true);
  };

  const handleAssessmentComplete = async (score: number) => {
    setShowAssessmentDialog(false);
    
    toast({
      title: "Assessment Completed!",
      description: `You scored ${score}%! Great work!`,
    });
    
    // Mark assessment as completed and navigate appropriately
    await learningHubService.markAssessmentCompleted(moduleId!, score);
    
    // Check if there's a next module
    const currentModuleIndex = orderedModules?.findIndex(m => m.id === moduleId) || 0;
    const nextModule = orderedModules?.[currentModuleIndex + 1];
    
    if (nextModule && canProgressToNext) {
      navigate(`/course/${courseId}/module/${nextModule.id}`);
    } else {
      // No next module or can't progress - go back to course overview
      navigate(`/course/${courseId}`);
    }
  };

  const isLastLessonInModule = currentLessonIndex === lessons.length - 1;
  const hasRequiredAssessment = moduleAssessments && moduleAssessments.length > 0;

  const getLessonProgress = (lessonId: string) => {
    return userProgress?.find(p => p.lesson_id === lessonId);
  };

  const isLessonCompleted = (lessonId: string) => {
    const progress = getLessonProgress(lessonId);
    return progress?.status === 'completed';
  };

  const getModuleProgress = () => {
    if (!lessons.length) return 0;
    const completedLessons = lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
    return Math.round((completedLessons / lessons.length) * 100);
  };

  const allLessonsCompleted = lessons.every(lesson => isLessonCompleted(lesson.id));
  const needsAssessment = isLastLessonInModule && hasRequiredAssessment && allLessonsCompleted && !isAssessmentCompleted;
  
  // Check if we should show assessment time screen
  const showAssessmentTimeScreen = currentLessonIndex >= lessons.length && needsAssessment;
  
  // Handle beginning assessment from the assessment time screen
  const handleBeginAssessment = () => {
    console.log('Beginning assessment:', {
      moduleAssessments,
      moduleAssessmentId: moduleAssessments?.[0]?.id
    });
    setShowAssessmentDialog(true);
  };

  const handleCompleteLesson = async () => {
    if (currentLesson) {
      try {
        const userEmail = await learningHubService.getCurrentUserEmail();
        await learningHubService.toggleLessonCompletion(userEmail, currentLesson.id);
        
        // Move to next lesson if available
        if (currentLessonIndex < lessons.length - 1) {
          setCurrentLessonIndex(currentLessonIndex + 1);
        } else {
          // Last lesson completed - check for module assessments
          if (hasRequiredAssessment && !isAssessmentCompleted) {
            // Show assessment time screen
            setCurrentLessonIndex(lessons.length);
          } else {
            // No assessments required - navigate to next module or course
            const currentModuleIndex = orderedModules?.findIndex(m => m.id === moduleId) || 0;
            const nextModule = orderedModules?.[currentModuleIndex + 1];
            if (nextModule && canProgressToNext) {
              navigate(`/course/${courseId}/module/${nextModule.id}`);
            } else {
              navigate(`/course/${courseId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error completing lesson:', error);
      }
    }
  };


  if (courseLoading || accessLoading || !course || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">You need to purchase this course to access the content.</p>
            <Button onClick={() => navigate(`/checkout/${courseId}`)}>
              Purchase Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasModuleAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Locked</h2>
              <p className="text-gray-600 mb-4">
                You need to complete the assessment from the previous module to unlock this content.
              </p>
            </div>
            <Button onClick={handleBackToCourse} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CourseAccessControl courseId={courseId!}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1120px] mx-auto px-4 py-8 md:py-12">
          {/* Cleo Logo */}
          {lessons.length > 0 ? (
            <>
              <div className="text-3xl font-bold mb-6" style={{ color: 'hsl(var(--cleo-green))' }}>
                Cleo
              </div>

              {/* Avatar */}
              <div className="cleo-avatar-large mb-6">
                <span>🧑🏻‍🔬</span>
              </div>

              {/* Course Title */}
              <h1 className="text-4xl font-bold text-center mb-4" style={{ letterSpacing: '-0.02em' }}>
                {course.subject} - {course.title}
              </h1>

              {/* Journey Card */}
              <div className="cleo-card mt-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-1">Your Learning Journey</h2>
                </div>

                {/* Journey Modules */}
                <div className="flex gap-6 justify-between flex-wrap mb-6">
                  {orderedModules?.map((module, index) => {
                    const isActive = module.id === moduleId;
                    const isLocked = false;
                    
                    return (
                      <div key={module.id} className="flex-1 min-w-[150px] text-center">
                        <div className={`cleo-module-circle ${isActive ? 'active' : isLocked ? 'locked' : 'locked'}`}>
                          {isLocked && !isActive ? '🔒' : index + 1}
                        </div>
                        <div className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--cleo-text-main))' }}>
                          {module.title}
                        </div>
                        <div className="text-xs" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
                          {module.lessons?.length || 0} lessons
                        </div>
                        {isActive && (
                          <div className="text-xs mt-1" style={{ color: 'hsl(var(--cleo-green))' }}>
                            Click to start
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Fact Cards */}
                <div className="flex gap-4 flex-wrap">
                  <div className="cleo-fact-card">
                    <div className="cleo-fact-emoji">🧫</div>
                    <div className="cleo-fact-text">
                      Human bodies contain about <strong>37 trillion cells</strong>.
                    </div>
                  </div>
                  <div className="cleo-fact-card">
                    <div className="cleo-fact-emoji">🧬</div>
                    <div className="cleo-fact-text">
                      If uncoiled, DNA in one cell would be about <strong>2 m long</strong>.
                    </div>
                  </div>
                  <div className="cleo-fact-card">
                    <div className="cleo-fact-emoji">🌱</div>
                    <div className="cleo-fact-text">
                      The study of plants is called <strong>botany</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons Section */}
              {(currentLesson || showAssessmentTimeScreen) ? (
            <div className="space-y-5 mt-8">
              {/* Lesson Navigation Card */}
              {currentLesson && (
                <div className="cleo-card p-5 md:p-6">
                  {/* Lesson Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Lesson {currentLessonIndex + 1}: {currentLesson.title}
                      </h3>
                      <p className="text-sm opacity-80">
                        {currentLessonIndex + 1} of {lessons.length} lessons
                      </p>
                    </div>
                    {isLessonCompleted(currentLesson.id) && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 self-start sm:self-auto">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="cleo-progress-track mb-6">
                    <div 
                      className="cleo-progress-fill"
                      style={{ 
                        width: `${((currentLessonIndex + 1) / lessons.length) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                      onClick={handlePreviousLesson}
                      disabled={currentLessonIndex === 0}
                      className="cleo-btn-outline flex items-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span>Previous</span>
                    </button>
                    
                    <span className="text-sm opacity-70 order-first sm:order-none">
                      Navigate lessons
                    </span>
                    
                    <button
                      onClick={handleNextLesson}
                      disabled={currentLessonIndex >= lessons.length - 1 && !showAssessmentTimeScreen}
                      className="cleo-btn-primary text-white flex items-center gap-2 w-full sm:w-auto font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Main Cleo Content Card */}
              <div className="cleo-card overflow-hidden relative cursor-pointer" 
                onClick={() => {
                  if (currentLesson) {
                    navigate(`/lesson-planning?topic=${encodeURIComponent(currentLesson.title)}&yearGroup=${encodeURIComponent(course.subject || 'GCSE')}&lessonId=${currentLesson.id}&moduleId=${moduleId}&courseId=${courseId}`);
                  }
                }}
              >
                <div className="p-0 min-h-[60vh] relative">
                  {currentLesson ? (
                    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center gap-4 relative">
                      {/* Radial gradient background */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at top, #eaf0ff, #f8fbff)',
                          opacity: 0.95,
                          top: '-40%',
                          bottom: 'auto',
                          borderRadius: '50%'
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 text-center px-6">
                        <div className="text-6xl mb-4">🦊</div>
                        <h3 className="text-2xl font-bold mb-2">
                          Start Learning with Cleo
                        </h3>
                        <p className="text-base opacity-85">
                          Cleo will prepare a personalized lesson just for you
                        </p>
                      </div>
                    </div>
                  ) : showAssessmentTimeScreen ? (
                    <AssessmentTimeScreen 
                      onBeginAssessment={handleBeginAssessment}
                      moduleTitle={currentModule.title}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>Select a lesson to begin learning with Cleo</p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            ) : null}
            </>
          ) : (
            <TopicSelectionScreen
              courseId={courseId!}
              moduleId={moduleId!}
              userName={user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
              topics={getTopicsForSubject(course.subject || 'General')}
              yearGroup={course.subject || 'GCSE'}
            />
          )}
        </div>
      </div>

      {/* Assessment Dialog */}
      {moduleAssessments?.length > 0 && (
        <ModuleAssessmentDialog
          isOpen={showAssessmentDialog}
          onClose={() => setShowAssessmentDialog(false)}
          assessmentId={moduleAssessments?.[0]?.id || ''}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}
    </CourseAccessControl>
  );
};

export default ModuleDetail;