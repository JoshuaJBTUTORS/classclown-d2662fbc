import React, { useRef, useEffect } from 'react';
import { ContentBlock } from '@/types/lessonContent';
import { TableBlock } from './content/TableBlock';
import { TextBlock } from './content/TextBlock';
import { QuestionBlock } from './content/QuestionBlock';
import { DefinitionBlock } from './content/DefinitionBlock';
import { DiagramBlock } from './content/DiagramBlock';
import { WorkedExampleBlock } from './content/WorkedExampleBlock';
import { QuoteAnalysisBlock } from './content/QuoteAnalysisBlock';

interface ContentDisplayProps {
  content: ContentBlock[];
  visibleContent: string[];
  onAnswerQuestion: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onContentAction?: (contentId: string, action: string, message: string) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
  isExamPractice?: boolean;
  subject?: string;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  visibleContent,
  onAnswerQuestion,
  onContentAction,
  onAskHelp,
  isExamPractice,
  subject,
}) => {
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastVisibleRef = useRef<string | null>(null);
  const previousVisibleCount = useRef<number>(0);

  useEffect(() => {
    if (visibleContent.length > 0) {
      // Find the first NEW content item that was just added
      let firstNewContent: string | null = null;
      
      // If content was added (length increased), find the first new item
      if (visibleContent.length > previousVisibleCount.current) {
        // Get the first item that wasn't in the previous state
        firstNewContent = visibleContent[previousVisibleCount.current];
      } else {
        // Fallback to latest content if nothing new
        firstNewContent = visibleContent[visibleContent.length - 1];
      }
      
      // Only scroll if this is a new content block
      if (firstNewContent && firstNewContent !== lastVisibleRef.current) {
        const element = contentRefs.current[firstNewContent];
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 100);
        }
        lastVisibleRef.current = firstNewContent;
      }
      
      // Update the count for next comparison
      previousVisibleCount.current = visibleContent.length;
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
        // Handle both string data and object data with content property
        const textData = typeof block.data === 'string' 
          ? block.data 
          : (block.data as any)?.content || block.data;
        return <TextBlock data={textData} onContentAction={handleContentAction} />;
      case 'table':
        return <TableBlock data={block.data} onContentAction={handleContentAction} />;
      case 'question':
        return (
          <QuestionBlock 
            data={block.data} 
            onAnswer={(questionId, answerId, isCorrect) => {
              // Use block.id instead of data.id since question data doesn't have an id field
              onAnswerQuestion(block.id, answerId, isCorrect);
            }}
            onAskHelp={onAskHelp} 
            subject={subject} 
          />
        );
      case 'definition':
        return <DefinitionBlock data={block.data} onContentAction={handleContentAction} />;
      case 'diagram':
        return <DiagramBlock data={block.data} onContentAction={handleContentAction} yearGroup={subject} />;
      case 'worked_example':
        return <WorkedExampleBlock data={block.data} onContentAction={handleContentAction} />;
      case 'quote_analysis':
        return <QuoteAnalysisBlock data={block.data} onContentAction={handleContentAction} />;
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
