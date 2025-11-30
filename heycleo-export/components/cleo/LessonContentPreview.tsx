import React from 'react';
import { ContentDisplay } from './ContentDisplay';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface LessonContentPreviewProps {
  lessonPlan: any;
  contentBlocks: any[];
  topic: string;
  courseId?: string;
  moduleId?: string;
  yearGroup?: string;
}

export const LessonContentPreview: React.FC<LessonContentPreviewProps> = ({
  lessonPlan,
  contentBlocks,
  topic,
  courseId,
  moduleId,
  yearGroup,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  
  // Show all content IDs (no progressive reveal)
  const allContentIds = contentBlocks.map(block => block.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {moduleId && courseId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/course/${courseId}/module/${moduleId}`)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold">{topic}</h1>
                <p className="text-sm text-muted-foreground">Visual Preview Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {contentBlocks.length} Content Blocks
              </div>
              {isAdmin && (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('preview');
                    setSearchParams(newParams);
                  }}
                >
                  <Play className="w-4 h-4" />
                  Start Lesson
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {lessonPlan?.learning_objectives && lessonPlan.learning_objectives.length > 0 && (
          <div className="mb-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <h2 className="text-lg font-semibold mb-3">Learning Objectives</h2>
            <ul className="space-y-2">
              {lessonPlan.learning_objectives.map((obj: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ContentDisplay
          content={contentBlocks}
          visibleContent={allContentIds}
          onAnswerQuestion={() => {}}
          onContentAction={() => {}}
          subject={yearGroup}
        />
      </div>
    </div>
  );
};
