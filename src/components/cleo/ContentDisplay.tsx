import React, { useRef, useEffect } from 'react';
import { ContentBlock } from '@/types/lessonContent';
import { TableBlock } from './content/TableBlock';
import { TextBlock } from './content/TextBlock';
import { QuestionBlock } from './content/QuestionBlock';
import { DefinitionBlock } from './content/DefinitionBlock';
import { DiagramBlock } from './content/DiagramBlock';

interface ContentDisplayProps {
  content: ContentBlock[];
  visibleContent: string[];
  onAnswerQuestion: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onContentAction?: (contentId: string, action: string, message: string) => void;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  visibleContent,
  onAnswerQuestion,
  onContentAction,
}) => {
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastVisibleRef = useRef<string | null>(null);

  useEffect(() => {
    if (visibleContent.length > 0) {
      const latestContent = visibleContent[visibleContent.length - 1];
      
      // Only scroll if this is a new content block
      if (latestContent !== lastVisibleRef.current) {
        const element = contentRefs.current[latestContent];
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }, 100);
        }
        lastVisibleRef.current = latestContent;
      }
    }
  }, [visibleContent]);

  const renderContent = (block: ContentBlock) => {
    // Validate block has required data
    if (!block || !block.type || block.data === undefined || block.data === null) {
      console.warn('Invalid content block:', block);
      return null;
    }

    const handleContentAction = (action: string, message: string) => {
      onContentAction?.(block.id, action, message);
    };

    switch (block.type) {
      case 'text':
        return <TextBlock data={block.data as string} onContentAction={handleContentAction} />;
      case 'table':
        return <TableBlock data={block.data} onContentAction={handleContentAction} />;
      case 'question':
        return <QuestionBlock data={block.data} onAnswer={onAnswerQuestion} />;
      case 'definition':
        return <DefinitionBlock data={block.data} onContentAction={handleContentAction} />;
      case 'diagram':
        return <DiagramBlock data={block.data} onContentAction={handleContentAction} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {content
        .filter(block => block && block.id && block.type && block.data !== undefined && block.data !== null)
        .map((block) => {
          const isVisible = visibleContent.includes(block.id);
          if (!isVisible) return null;

          return (
            <div
              key={block.id}
              ref={(el) => (contentRefs.current[block.id] = el)}
              className="scroll-mt-24"
            >
              {renderContent(block)}
            </div>
          );
        })}
    </div>
  );
};
