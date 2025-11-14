import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { usePersonalizedLearningPath } from '@/hooks/usePersonalizedLearningPath';
import { CourseLesson } from '@/types/course';
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
import { useCourseTopics } from '@/hooks/useCourseTopics';

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

  const { data: subscriptionAccess } = useQuery({
    queryKey: ['platform-subscription-access', user?.id],
    queryFn: () => paymentService.checkPlatformSubscriptionAccess(),
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

  // Fetch available topics from current module lessons
  const { data: availableTopics = [] } = useCourseTopics(courseId!, moduleId!);

  // Fetch completed lessons for the current user and module
  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['completed-lessons', moduleId, user?.id],
    queryFn: async () => {
      if (!user?.id || !availableTopics.length) return [];
      
      const { data, error } = await supabase
        .from('student_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('lesson_id', availableTopics.map(t => t.id));
      
      if (error) {
        console.error('Error fetching completed lessons:', error);
        return [];
      }
      
      return data?.map(d => d.lesson_id) || [];
    },
    enabled: !!moduleId && !!user && availableTopics.length > 0
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
  const hasAccess = isOwner || subscriptionAccess?.hasAccess;

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
      <TopicSelectionScreen
        courseId={courseId!}
        moduleId={moduleId!}
        userName={user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
        topics={availableTopics}
        yearGroup={course.subject || 'GCSE'}
        completedLessonIds={completedLessonIds}
      />

      {/* Module Assessment Dialog */}
      {moduleAssessments && moduleAssessments.length > 0 && showAssessmentDialog && (
        <ModuleAssessmentDialog
          isOpen={showAssessmentDialog}
          onClose={() => setShowAssessmentDialog(false)}
          assessmentId={moduleAssessments[0].id}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}
    </CourseAccessControl>
  );
};

export default ModuleDetail;