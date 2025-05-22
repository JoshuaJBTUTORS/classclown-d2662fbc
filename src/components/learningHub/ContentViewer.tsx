
import React from 'react';
import { CourseLesson } from '@/types/course';
import VideoEmbed from './VideoEmbed';
import QuizEmbed from './QuizEmbed';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ContentViewerProps {
  lesson: CourseLesson;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ lesson }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // This renders the appropriate content based on content_type
  const renderContent = () => {
    switch (lesson.content_type) {
      case 'video':
        return <VideoEmbed src={lesson.content_url || ''} title={lesson.title} />;
      case 'quiz':
        return <QuizEmbed src={lesson.content_url || ''} title={lesson.title} />;
      case 'text':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text || '' }} />
          </div>
        );
      default:
        return <div>Unsupported content type: {lesson.content_type}</div>;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{lesson.title}</h2>
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
