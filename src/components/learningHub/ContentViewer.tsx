
import React from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';
import AIAssessmentViewer from './AIAssessmentViewer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContentViewerProps {
  lesson: CourseLesson;
  isLoading?: boolean;
  onContentTypeChange?: (contentType: string) => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ 
  lesson, 
  isLoading = false,
  onContentTypeChange
}) => {
  const isMobile = useIsMobile();

  // Notify parent component about content type change
  React.useEffect(() => {
    if (onContentTypeChange && lesson.content_type) {
      onContentTypeChange(lesson.content_type);
    }
  }, [lesson.content_type, onContentTypeChange]);

  // This renders the appropriate content based on content_type
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-pulse">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      );
    }
    
    switch (lesson.content_type) {
      case 'video':
        return (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <VideoEmbed 
              src={lesson.content_url || ''} 
              title={lesson.title}
              className="rounded-lg overflow-hidden shadow-inner aspect-video w-full"
            />
          </div>
        );
      case 'quiz':
        return (
          <div className="bg-white rounded-lg overflow-hidden">
            <QuizEmbed 
              src={lesson.content_url || ''} 
              title={lesson.title} 
              className="rounded-lg overflow-hidden"
            />
          </div>
        );
      case 'ai-assessment':
        return (
          <div className="bg-white rounded-lg overflow-hidden">
            <AIAssessmentViewer 
              assessmentId={lesson.content_url || ''} 
              embedded={true} 
            />
          </div>
        );
      case 'text':
        return (
          <div className="bg-white rounded-lg">
            <div className="prose max-w-none p-4 sm:p-8 leading-relaxed text-sm sm:text-base">
              <div dangerouslySetInnerHTML={{ __html: lesson.content_text || '' }} />
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-6 sm:p-8 text-center rounded-lg">
            <div className="text-gray-500 text-sm sm:text-base">
              Unsupported content type: {lesson.content_type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default ContentViewer;
