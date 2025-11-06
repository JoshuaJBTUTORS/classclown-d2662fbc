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

const ModuleDetail = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
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

  const { data: canProgressToNext } = useQuery({
    queryKey: ['can-progress', moduleId, personalizedOrder?.isPersonalized],
    queryFn: async () => {
      if (!orderedModules || !moduleId) return true;
      const currentModuleIndex = orderedModules.findIndex(m => m.id === moduleId);
      const nextModule = orderedModules[currentModuleIndex + 1];
      if (!nextModule) return true; // No next module, can always progress
      
      // Use personalized path access control if available
      return personalizedOrder?.isPersonalized 
        ? await learningHubService.checkModuleAccessWithPersonalizedPath(nextModule.id, orderedModules)
        : await learningHubService.canProgressToModule(nextModule.id);
    },
    enabled: !!orderedModules && !!moduleId,
  });

  const { data: isAssessmentCompleted } = useQuery({
    queryKey: ['assessment-completed', moduleId],
    queryFn: () => learningHubService.isModuleAssessmentCompleted(moduleId!),
    enabled: !!moduleId,
  });

  const { data: hasModuleAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['module-access', moduleId, personalizedOrder?.isPersonalized],
    queryFn: () => {
      // Use personalized path access control if available
      return personalizedOrder?.isPersonalized 
        ? learningHubService.checkModuleAccessWithPersonalizedPath(moduleId!, orderedModules || [])
        : learningHubService.checkModuleAccess(moduleId!);
    },
    enabled: !!moduleId && !!orderedModules,
  });

  const currentModule = orderedModules?.find(m => m.id === moduleId);
  const allLessons = currentModule?.lessons || [];
  
  // Filter out AI assessment lessons from regular lesson flow
  const lessons = allLessons.filter(lesson => lesson.content_type !== 'ai-assessment');
  const aiAssessmentLessons = allLessons.filter(lesson => lesson.content_type === 'ai-assessment');
  
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
      // At the end of regular lessons - check for assessments first
      const hasAIAssessments = allLessons.filter(lesson => lesson.content_type === 'ai-assessment').length > 0;
      
      if (hasAIAssessments || (hasRequiredAssessment && !isAssessmentCompleted)) {
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
  const showAssessmentTimeScreen = currentLessonIndex >= lessons.length && (aiAssessmentLessons.length > 0 || needsAssessment);
  
  // Handle beginning assessment from the assessment time screen
  const handleBeginAssessment = () => {
    console.log('Beginning assessment:', {
      aiAssessmentLessons,
      moduleAssessments,
      aiAssessmentId: aiAssessmentLessons.length > 0 ? aiAssessmentLessons[0]?.content_url : null,
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
          // Last regular lesson completed - check for assessments using original module data
          const hasAIAssessments = allLessons.filter(lesson => lesson.content_type === 'ai-assessment').length > 0;
          
          if (hasAIAssessments || (hasRequiredAssessment && !isAssessmentCompleted)) {
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

  // Check module access control
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
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="fixed top-4 left-4 z-30">
          <Button
            onClick={handleBackToCourse}
            variant="ghost"
            className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-primary shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Course
          </Button>
        </div>

        <div className="pt-16 px-2 sm:px-4 lg:px-8">
          <div className="w-full max-w-none py-8">
            {/* Module Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{course.subject}</Badge>
                  <Badge variant="secondary">Module {orderedModules?.findIndex(m => m.id === moduleId)! + 1}</Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl">{currentModule.title}</CardTitle>
                {currentModule.description && (
                  <p className="text-gray-600 mt-2">{currentModule.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm text-gray-600">{getModuleProgress()}% complete</span>
                  </div>
                </div>
              </CardHeader>
            </Card>


            {lessons.length > 0 && (currentLesson || showAssessmentTimeScreen) ? (
              <div className="space-y-4">
                {/* Lesson Navigation Card */}
                {currentLesson && (
                  <Card>
                    <CardContent className="p-6">
                      {/* Lesson Info Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            Lesson {currentLessonIndex + 1}: {currentLesson.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {currentLessonIndex + 1} of {lessons.length} lessons
                          </p>
                        </div>
                        {isLessonCompleted(currentLesson.id) && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((currentLessonIndex + 1) / lessons.length) * 100}%` 
                          }}
                        />
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={handlePreviousLesson}
                          disabled={currentLessonIndex === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          Navigate lessons
                        </span>
                        
                        <Button
                          onClick={handleNextLesson}
                          disabled={currentLessonIndex >= lessons.length - 1 && !showAssessmentTimeScreen}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Cleo Content Card */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0 min-h-[60vh]">
                    {currentLesson ? (
                      <Button
                        onClick={() => {
                          navigate(`/lesson-planning?topic=${encodeURIComponent(currentLesson.title)}&yearGroup=${encodeURIComponent(course.subject || 'GCSE')}&lessonId=${currentLesson.id}&moduleId=${moduleId}&courseId=${courseId}`);
                        }}
                        className="w-full h-full min-h-[60vh] bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 flex flex-col items-center justify-center gap-4"
                        variant="ghost"
                      >
                        <Bot className="w-16 h-16 text-primary" />
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-foreground mb-2">
                            Start Learning with Cleo
                          </h3>
                          <p className="text-muted-foreground">
                            Cleo will prepare a personalized lesson just for you
                          </p>
                        </div>
                      </Button>
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
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600">No lessons available in this module yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Assessment Dialog */}
        {(moduleAssessments?.length > 0 || aiAssessmentLessons.length > 0) && (
          <ModuleAssessmentDialog
            isOpen={showAssessmentDialog}
            onClose={() => setShowAssessmentDialog(false)}
            assessmentId={
              aiAssessmentLessons.length > 0 && aiAssessmentLessons[0]?.content_url
                ? aiAssessmentLessons[0].content_url
                : moduleAssessments?.[0]?.id || ''
            }
            onAssessmentComplete={handleAssessmentComplete}
          />
        )}
      </div>
    </CourseAccessControl>
  );
};

export default ModuleDetail;