import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { VoiceControls } from './VoiceControls';
import { SlideContentDisplay } from './SlideContentDisplay';
import { LessonRulesCard } from './LessonRulesCard';
import { QuickPromptButtons } from './QuickPromptButtons';
import { Send, Loader2 } from 'lucide-react';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { ContentBlock } from '@/types/lessonContent';
import { cleoQuestionTrackingService } from '@/services/cleoQuestionTrackingService';
import { toast } from 'sonner';

interface HybridChatInterfaceProps {
  mode: ChatMode;
  messages: CleoMessage[];
  isVoiceConnected: boolean;
  isVoiceListening: boolean;
  isVoiceSpeaking: boolean;
  isTextLoading: boolean;
  onVoiceConnect: () => void;
  onVoiceDisconnect: () => void;
  onTextSend: (message: string) => void;
  contentBlocks?: ContentBlock[];
  visibleContentIds?: string[];
  onAnswerQuestion?: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onContentAction?: (contentId: string, action: string, message: string) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
  isExamPractice?: boolean;
  conversationId?: string | null;
  onToggleMute?: () => void;
  isMuted?: boolean;
  isConnecting?: boolean;
  subject?: string;
  onQuickPrompt?: (prompt: string) => void;
  onRepeatLast?: () => void;
  isSaving?: boolean;
  currentSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export const HybridChatInterface: React.FC<HybridChatInterfaceProps> = ({
  mode,
  messages,
  isVoiceConnected,
  isVoiceListening,
  isVoiceSpeaking,
  isTextLoading,
  onVoiceConnect,
  onVoiceDisconnect,
  onTextSend,
  contentBlocks,
  visibleContentIds,
  onAnswerQuestion,
  onContentAction,
  onAskHelp,
  isExamPractice,
  conversationId,
  onToggleMute,
  isMuted,
  isConnecting,
  subject,
  onQuickPrompt,
  onRepeatLast,
  isSaving,
  currentSlideIndex = 0,
  onSlideChange,
  isPaused,
  onTogglePause,
}) => {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});
  const [internalSlideIndex, setInternalSlideIndex] = useState(0);
  
  // Use external slide index if provided, otherwise internal
  const slideIndex = onSlideChange ? currentSlideIndex : internalSlideIndex;
  const handleSlideChange = onSlideChange || setInternalSlideIndex;
  
  // Rules card visibility: show until move_to_step is called (content becomes visible)
  const shouldShowRulesCard = !visibleContentIds || visibleContentIds.length === 0;

  useEffect(() => {
    // Only scroll within the content container, never affect page scroll
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // Track when questions become visible
  useEffect(() => {
    if (!contentBlocks || !visibleContentIds) return;

    const newQuestions = visibleContentIds.filter(id => {
      const block = contentBlocks.find(b => b.id === id && b.type === 'question');
      return block && !questionStartTimes[id];
    });

    if (newQuestions.length > 0) {
      setQuestionStartTimes(prev => {
        const updated = { ...prev };
        newQuestions.forEach(qId => {
          updated[qId] = Date.now();
        });
        return updated;
      });
    }
  }, [visibleContentIds, contentBlocks]);
  

  const handleAnswerQuestion = async (questionId: string, answerId: string, isCorrect: boolean) => {
    const timeTaken = questionStartTimes[questionId] 
      ? Math.floor((Date.now() - questionStartTimes[questionId]) / 1000)
      : undefined;

    const questionBlock = contentBlocks?.find(b => b.id === questionId);
    const questionData = questionBlock?.data as any;

    if (conversationId && questionBlock) {
      try {
        await cleoQuestionTrackingService.recordQuestionAnswer({
          conversation_id: conversationId,
          question_id: questionId,
          question_text: questionData?.question || '',
          answer_id: answerId,
          answer_text: questionData?.options?.find((o: any) => o.id === answerId)?.text || '',
          is_correct: isCorrect,
          time_taken_seconds: timeTaken,
          step_id: questionBlock.stepId || '',
        });

        // Show coin notification for correct answers
        if (isCorrect) {
          toast.success('🪙 +2 coins earned!', {
            description: 'Keep going to unlock mastery levels!',
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Failed to record question answer:', error);
      }
    }

    onAnswerQuestion?.(questionId, answerId, isCorrect);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isTextLoading) {
      onTextSend(textInput);
      setTextInput('');
    }
  };

  // Auto-advance to latest slide when new content appears
  useEffect(() => {
    if (visibleContentIds && visibleContentIds.length > 0 && contentBlocks) {
      const visibleBlocks = contentBlocks.filter(
        block => block && block.id && visibleContentIds.includes(block.id)
      );
      // Auto-advance to the last (newest) slide when content is added
      if (visibleBlocks.length > 0 && slideIndex < visibleBlocks.length - 1) {
        handleSlideChange(visibleBlocks.length - 1);
      }
    }
  }, [visibleContentIds?.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Content Area - Slide View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Show Rules Card until move_to_step is called (content becomes visible) */}
        {shouldShowRulesCard && (
          <div className="flex-1 flex items-center justify-center px-4">
            <LessonRulesCard />
          </div>
        )}
        
        {/* Slide Content - Show after voice connects */}
        {isVoiceConnected && contentBlocks && visibleContentIds && visibleContentIds.length > 0 && (
          <SlideContentDisplay
            content={contentBlocks}
            visibleContent={visibleContentIds}
            currentSlideIndex={slideIndex}
            onSlideChange={handleSlideChange}
            onAnswerQuestion={handleAnswerQuestion}
            onContentAction={onContentAction}
            onAskHelp={onAskHelp}
            isExamPractice={isExamPractice}
            subject={subject}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 space-y-3">
        {/* Save Indicator */}
        {isSaving && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving progress...
          </div>
        )}
        
        {/* Quick Prompt Buttons */}
        {onQuickPrompt && (
          <QuickPromptButtons 
            onPromptClick={onQuickPrompt}
            isConnected={isVoiceConnected}
            isSpeaking={isVoiceSpeaking}
          />
        )}
        
        {mode === 'voice' ? (
          <div className="flex justify-center">
            <VoiceControls
              isConnected={isVoiceConnected}
              isListening={isVoiceListening}
              isSpeaking={isVoiceSpeaking}
              onConnect={onVoiceConnect}
              onDisconnect={onVoiceDisconnect}
              conversationId={conversationId || undefined}
              onToggleMute={onToggleMute}
              isMuted={isMuted}
              isConnecting={isConnecting}
              onRepeatLast={onRepeatLast}
              isPaused={isPaused}
              onTogglePause={onTogglePause}
            />
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isTextLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isTextLoading || !textInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
