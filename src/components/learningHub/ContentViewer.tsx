
import React, { useEffect } from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

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

  const markCompleteMutation = useMutation({
    mutationFn: () => learningHubService.markLessonComplete(user!.id, lesson.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      
      toast({
        title: "Lesson completed!",
        description: "Great job! Moving to the next lesson.",
      });

      onLessonComplete?.(lesson.id);
    },
    onError: (error) => {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Error marking lesson complete",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Auto-mark lesson as complete when user accesses it (Udemy-style)
  useEffect(() => {
    if (user && !isCompleted && !markCompleteMutation.isPending) {
      markCompleteMutation.mutate();
    }
  }, [user, lesson.id, isCompleted]);

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
    </div>
  );
};

export default ContentViewer;
