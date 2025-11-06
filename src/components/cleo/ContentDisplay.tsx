import React from 'react';
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
        .map((block) => (
          <div key={block.id} className="scroll-mt-24">
            {renderContent(block)}
          </div>
        ))}
    </div>
  );
};
