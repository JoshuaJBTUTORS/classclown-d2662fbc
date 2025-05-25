
import React from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';

interface ContentViewerProps {
  lesson: CourseLesson;
  isLoading?: boolean;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ 
  lesson, 
  isLoading = false
}) => {
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
          <div className="prose max-w-none p-4">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text || '' }} />
          </div>
        );
      default:
        return <div>Unsupported content type: {lesson.content_type}</div>;
    }
  };

  return (
    <div className="space-y-3 h-full">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold">{lesson.title}</h2>
      </div>
      
      {lesson.description && (
        <p className="text-gray-500 text-sm px-1">{lesson.description}</p>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-280px)]">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentViewer;
