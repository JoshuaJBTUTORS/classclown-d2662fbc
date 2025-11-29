import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentBlock, AIMarkingResult } from '@/types/lessonContent';
import { TableBlock } from './content/TableBlock';
import { TextBlock } from './content/TextBlock';
import { QuestionBlock } from './content/QuestionBlock';
import { DefinitionBlock } from './content/DefinitionBlock';
import { DiagramBlock } from './content/DiagramBlock';
import { WorkedExampleBlock } from './content/WorkedExampleBlock';
import { QuoteAnalysisBlock } from './content/QuoteAnalysisBlock';
import { SlideNavigation } from './SlideNavigation';

interface SlideContentDisplayProps {
  content: ContentBlock[];
  visibleContent: string[];
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onAnswerQuestion: (questionId: string, answerId: string, isCorrect: boolean, markingResult?: AIMarkingResult) => void;
  onContentAction?: (contentId: string, action: string, message: string) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
  isExamPractice?: boolean;
  subject?: string;
  allowForwardNavigation?: boolean;
}

export const SlideContentDisplay: React.FC<SlideContentDisplayProps> = ({
  content,
  visibleContent,
  currentSlideIndex,
  onSlideChange,
  onAnswerQuestion,
  onContentAction,
  onAskHelp,
  isExamPractice,
  subject,
  allowForwardNavigation = false, // Default: no peeking ahead - Cleo controls content reveal
}) => {
  // Filter to only visible content blocks
  const visibleBlocks = content.filter(
    block => block && block.id && block.type && block.data !== undefined && block.data !== null && visibleContent.includes(block.id)
  );

  const totalSlides = visibleBlocks.length;
  const currentBlock = visibleBlocks[currentSlideIndex];

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      onSlideChange(currentSlideIndex + 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, totalSlides]);

  const renderContent = (block: ContentBlock) => {
    if (!block || !block.type || block.data === undefined || block.data === null) {
      return null;
    }

    const handleContentAction = (action: string, message: string) => {
      onContentAction?.(block.id, action, message);
    };

    switch (block.type) {
      case 'text':
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
            onAnswer={(questionId, answerId, isCorrect, markingResult) => {
              // Use block.id instead of data.id since question data doesn't have an id field
              onAnswerQuestion(block.id, answerId, isCorrect, markingResult);
            }}
            onAskHelp={onAskHelp} 
            subject={subject} 
          />
        );
      case 'definition':
        return <DefinitionBlock data={block.data} onContentAction={handleContentAction} />;
      case 'diagram':
        return <DiagramBlock data={block.data} onContentAction={handleContentAction} />;
      case 'worked_example':
        return <WorkedExampleBlock data={block.data} onContentAction={handleContentAction} />;
      case 'quote_analysis':
        return <QuoteAnalysisBlock data={block.data} onContentAction={handleContentAction} />;
      default:
        return null;
    }
  };

  if (totalSlides === 0 || !currentBlock) {
    return null;
  }

  return (
    <div className="slide-container flex flex-col h-full">
      {/* Main Slide Area */}
      <div className="slide-content-area flex-1 flex items-center justify-center overflow-hidden px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBlock.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="slide-content w-full max-w-3xl"
          >
            {renderContent(currentBlock)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <SlideNavigation
        currentIndex={currentSlideIndex}
        totalSlides={totalSlides}
        onPrevious={handlePrevious}
        onNext={allowForwardNavigation ? handleNext : undefined}
        onDotClick={(index) => {
          // Only allow clicking on past/current slides unless forward navigation allowed
          if (allowForwardNavigation || index <= currentSlideIndex) {
            onSlideChange(index);
          }
        }}
      />
    </div>
  );
};
