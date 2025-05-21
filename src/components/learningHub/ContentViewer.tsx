
import React from 'react';
import { CourseLesson } from '@/types/course';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Video, FileQuestion } from 'lucide-react';

interface ContentViewerProps {
  lesson: CourseLesson | null;
  isLoading?: boolean;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ lesson, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-80 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!lesson) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No lesson selected</h3>
          <p className="text-gray-500">
            Please select a lesson from the sidebar to view its content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {lesson.content_type === 'video' && lesson.content_url && (
          <div className="mb-4 aspect-video">
            <iframe
              className="w-full h-full"
              src={lesson.content_url}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {lesson.content_type === 'pdf' && lesson.content_url && (
          <div className="mb-4 border rounded-lg overflow-hidden h-[70vh]">
            <iframe
              className="w-full h-full"
              src={lesson.content_url}
              title={lesson.title}
            ></iframe>
          </div>
        )}

        {lesson.content_type === 'text' && lesson.content_text && (
          <div className="prose max-w-none mb-4">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text }}></div>
          </div>
        )}

        {lesson.content_type === 'quiz' && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center mb-4">
              <FileQuestion className="h-6 w-6 mr-2 text-blue-500" />
              <h3 className="text-lg font-medium">Quiz: {lesson.title}</h3>
            </div>
            <p>Quiz functionality will be implemented in a future update.</p>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-gray-700">{lesson.description}</p>
        )}

        {lesson.duration_minutes && (
          <p className="text-sm text-gray-500 mt-4">
            Duration: {lesson.duration_minutes} minutes
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentViewer;
