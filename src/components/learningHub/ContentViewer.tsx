
import React from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, PlayCircle } from 'lucide-react';

interface ContentViewerProps {
  lesson: CourseLesson;
  isLoading?: boolean;
  onLessonComplete?: (lessonId: string) => void;
  studentProgress?: any;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ 
  lesson, 
  isLoading = false, 
  onLessonComplete,
  studentProgress 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isCompleted = studentProgress?.status === 'completed';
  const currentProgress = studentProgress?.completion_percentage || 0;

  const updateProgressMutation = useMutation({
    mutationFn: (progressData: any) => learningHubService.createOrUpdateProgress(progressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
    },
    onError: (error) => {
      console.error('Error updating progress:', error);
      toast({
        title: "Error updating progress",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleVideoProgress = (percentage: number) => {
    if (!user || isCompleted) return;

    // Update progress in database every 10% increment
    if (Math.floor(percentage / 10) > Math.floor(currentProgress / 10)) {
      updateProgressMutation.mutate({
        student_id: user.id,
        lesson_id: lesson.id,
        status: percentage >= 90 ? 'completed' : 'in_progress',
        completion_percentage: Math.round(percentage)
      });
    }
  };

  const handleVideoComplete = () => {
    if (!user || isCompleted) return;

    updateProgressMutation.mutate({
      student_id: user.id,
      lesson_id: lesson.id,
      status: 'completed',
      completion_percentage: 100
    });

    toast({
      title: "Lesson completed!",
      description: "Great job! Moving to the next lesson.",
    });

    onLessonComplete?.(lesson.id);
  };

  const handleMarkComplete = () => {
    if (!user) return;

    updateProgressMutation.mutate({
      student_id: user.id,
      lesson_id: lesson.id,
      status: 'completed',
      completion_percentage: 100
    });

    onLessonComplete?.(lesson.id);
  };

  const handleStartLesson = () => {
    if (!user) return;

    updateProgressMutation.mutate({
      student_id: user.id,
      lesson_id: lesson.id,
      status: 'in_progress',
      completion_percentage: 0
    });
  };

  // This renders the appropriate content based on content_type
  const renderContent = () => {
    if (isLoading) {
      return <div className="p-8 text-center">Loading content...</div>;
    }
    
    switch (lesson.content_type) {
      case 'video':
        return (
          <VideoEmbed 
            src={lesson.content_url || ''} 
            title={lesson.title}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
          />
        );
      case 'quiz':
        return <QuizEmbed src={lesson.content_url || ''} title={lesson.title} />;
      case 'text':
        return (
          <div className="prose max-w-none p-6">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text || '' }} />
          </div>
        );
      default:
        return <div>Unsupported content type: {lesson.content_type}</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lesson.title}</h2>
        {isCompleted && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>
      
      {lesson.description && (
        <p className="text-gray-500">{lesson.description}</p>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {renderContent()}
      </div>

      {/* Action buttons for non-video content */}
      {lesson.content_type !== 'video' && user && (
        <div className="flex justify-end space-x-2">
          {!studentProgress && (
            <Button onClick={handleStartLesson} variant="outline">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Lesson
            </Button>
          )}
          {studentProgress && !isCompleted && (
            <Button onClick={handleMarkComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentViewer;
