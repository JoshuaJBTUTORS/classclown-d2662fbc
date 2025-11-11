import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { VoiceControls } from './VoiceControls';
import { ContentDisplay } from './ContentDisplay';
import { Send } from 'lucide-react';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { ContentBlock } from '@/types/lessonContent';
import { cleoQuestionTrackingService } from '@/services/cleoQuestionTrackingService';

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
}) => {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-4 px-4">
        {/* Content Blocks */}
        {contentBlocks && visibleContentIds && visibleContentIds.length > 0 && (
          <ContentDisplay
            content={contentBlocks}
            visibleContent={visibleContentIds}
            onAnswerQuestion={handleAnswerQuestion}
            onContentAction={onContentAction}
            onAskHelp={onAskHelp}
            isExamPractice={isExamPractice}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        {mode === 'voice' ? (
          <div className="flex justify-center">
            <VoiceControls
              isConnected={isVoiceConnected}
              isListening={isVoiceListening}
              isSpeaking={isVoiceSpeaking}
              onConnect={onVoiceConnect}
              onDisconnect={onVoiceDisconnect}
              conversationId={conversationId || undefined}
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
