import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import ContentViewer from '@/components/learningHub/ContentViewer';
import NotesSection from '@/components/learningHub/NotesSection';
import AssessmentNavigation from '@/components/learningHub/AssessmentNavigation';
import ModuleAssessmentDialog from '@/components/learningHub/ModuleAssessmentDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen,
  CheckCircle,
  Play,
  Trophy
} from 'lucide-react';

const ModuleDetail = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);

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
    queryKey: ['can-progress', moduleId],
    queryFn: async () => {
      if (!modules || !moduleId) return true;
      const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
      const nextModule = modules[currentModuleIndex + 1];
      if (!nextModule) return true; // No next module, can always progress
      return await learningHubService.canProgressToModule(nextModule.id);
    },
    enabled: !!modules && !!moduleId,
  });

  const { data: isAssessmentCompleted } = useQuery({
    queryKey: ['assessment-completed', moduleId],
    queryFn: () => learningHubService.isModuleAssessmentCompleted(moduleId!),
    enabled: !!moduleId,
  });

  const currentModule = modules?.find(m => m.id === moduleId);
  const lessons = currentModule?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const hasAccess = isOwner || hasPurchased;

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
      // If this is the last lesson, check if there's a next module
      const currentModuleIndex = modules?.findIndex(m => m.id === moduleId) || 0;
      const nextModule = modules?.[currentModuleIndex + 1];
      if (nextModule) {
        // Check if user can progress to next module (assessment requirement)
        if (canProgressToNext) {
          navigate(`/course/${courseId}/module/${nextModule.id}`);
        } else {
          // Show assessment requirement message
          console.log('Assessment completion required before progressing to next module');
        }
      }
    }
  };

  const handleTakeAssessment = () => {
    setShowAssessmentDialog(true);
  };

  const handleAssessmentComplete = async (score: number) => {
    setShowAssessmentDialog(false);
    
    if (currentLesson && moduleAssessments && moduleAssessments.length > 0) {
      const passingScore = moduleAssessments[0].passing_score || 70;
      
      if (score >= passingScore) {
        await learningHubService.markAssessmentCompleted(currentLesson.id, score);
        
        toast({
          title: "Assessment Completed!",
          description: `You scored ${score}% and passed the assessment. Next module unlocked!`,
        });
        
        const currentModuleIndex = modules?.findIndex(m => m.id === moduleId) || 0;
        const nextModule = modules?.[currentModuleIndex + 1];
        if (nextModule) {
          navigate(`/course/${courseId}/module/${nextModule.id}`);
        }
      } else {
        toast({
          title: "Assessment Not Passed",
          description: `You scored ${score}%. You need at least ${passingScore}% to unlock the next module.`,
          variant: "destructive",
        });
      }
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

  const handleCompleteLesson = async () => {
    if (currentLesson) {
      try {
        const userEmail = await learningHubService.getCurrentUserEmail();
        await learningHubService.toggleLessonCompletion(userEmail, currentLesson.id);
        // Refresh progress data
        // queryClient.invalidateQueries(['user-progress']);
        handleNextLesson();
      } catch (error) {
        console.error('Error completing lesson:', error);
      }
    }
  };


  if (courseLoading || !course || !currentModule) {
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

        <div className="pt-16 px-4">
          <div className="container mx-auto py-8 max-w-4xl">
            {/* Module Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{course.subject}</Badge>
                  <Badge variant="secondary">Module {modules?.findIndex(m => m.id === moduleId)! + 1}</Badge>
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

            {lessons.length > 0 && currentLesson ? (
              <div className="space-y-6">
                {/* Lesson Navigation */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Lesson {currentLessonIndex + 1}: {currentLesson.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {currentLessonIndex + 1} of {lessons.length} lessons
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLessonCompleted(currentLesson.id) && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {currentLesson.duration_minutes && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{currentLesson.duration_minutes} min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentLessonIndex + 1) / lessons.length) * 100}%` }}
                      />
                    </div>

                    {/* Assessment requirement notification */}
                    {needsAssessment && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <h4 className="font-medium text-yellow-800">Assessment Required</h4>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          Complete the module assessment to unlock the next module.
                        </p>
                        <Button
                          onClick={handleTakeAssessment}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Take Assessment
                        </Button>
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePreviousLesson}
                        disabled={currentLessonIndex === 0}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      {needsAssessment ? (
                        <Button
                          onClick={handleTakeAssessment}
                          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                        >
                          Take Assessment
                          <Trophy className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={isLessonCompleted(currentLesson.id) ? handleNextLesson : handleCompleteLesson}
                          className="flex items-center gap-2"
                        >
                          {isLessonCompleted(currentLesson.id) ? (
                            <>
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Complete & Continue
                              <CheckCircle className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lesson Content */}
                <Card>
                  <CardContent className="p-0">
                    <ContentViewer lesson={currentLesson} />
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card>
                  <CardContent className="p-6">
                    <NotesSection 
                      courseId={courseId!}
                      lessonId={currentLesson.id}
                      lessonTitle={currentLesson.title}
                      contentType={currentLesson.content_type}
                    />
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
        {moduleAssessments && moduleAssessments.length > 0 && (
          <ModuleAssessmentDialog
            isOpen={showAssessmentDialog}
            onClose={() => setShowAssessmentDialog(false)}
            assessmentId={moduleAssessments[0].ai_assessments.id}
            onAssessmentComplete={handleAssessmentComplete}
          />
        )}
      </div>
    </CourseAccessControl>
  );
};

export default ModuleDetail;