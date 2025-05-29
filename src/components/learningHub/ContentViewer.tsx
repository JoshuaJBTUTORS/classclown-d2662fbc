
import React from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';
import AIAssessmentViewer from './AIAssessmentViewer';

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
  // Notify parent component about content type change
  React.useEffect(() => {
    if (onContentTypeChange && lesson.content_type) {
      onContentTypeChange(lesson.content_type);
    }
  }, [lesson.content_type, onContentTypeChange]);

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
      case 'ai-assessment':
        return <AIAssessmentViewer assessmentId={lesson.content_url || ''} embedded={true} />;
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default ContentViewer;
