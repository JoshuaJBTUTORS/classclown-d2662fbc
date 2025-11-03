import React from 'react';
import { LessonProgressBar } from './LessonProgressBar';
import { ContentDisplay } from './ContentDisplay';
import { VoiceControls } from './VoiceControls';
import { CleoVoiceChat } from './CleoVoiceChat';
import { useContentSync } from '@/hooks/useContentSync';
import { LessonData } from '@/types/lessonContent';

interface CleoInteractiveLearningProps {
  lessonData: LessonData;
  conversationId?: string;
}

export const CleoInteractiveLearning: React.FC<CleoInteractiveLearningProps> = ({
  lessonData,
  conversationId,
}) => {
  const {
    activeStep,
    visibleContent,
    completedSteps,
    handleContentEvent,
  } = useContentSync(lessonData);

  const [connectionState, setConnectionState] = React.useState<
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const voiceChatRef = React.useRef<{
    connect: () => void;
    disconnect: () => void;
  } | null>(null);

  const handleAnswerQuestion = (
    questionId: string,
    answerId: string,
    isCorrect: boolean
  ) => {
    console.log('📝 Answer submitted:', { questionId, answerId, isCorrect });
    // The answer will be sent via the voice chat component
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
      {/* Lesson Progress Bar */}
      <LessonProgressBar
        steps={lessonData.steps}
        currentStep={activeStep}
        completedSteps={completedSteps}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Lesson Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {lessonData.title}
            </h1>
            <p className="text-muted-foreground">
              {lessonData.topic} • {lessonData.yearGroup}
            </p>
          </div>

          {/* Content Display */}
          <ContentDisplay
            content={lessonData.content}
            visibleContent={visibleContent}
            onAnswerQuestion={handleAnswerQuestion}
          />

          {/* Spacer for floating controls */}
          <div className="h-32" />
        </div>
      </div>

      {/* Hidden Voice Chat Component */}
      <div className="hidden">
        <CleoVoiceChat
          ref={voiceChatRef}
          conversationId={conversationId}
          topic={lessonData.topic}
          yearGroup={lessonData.yearGroup}
          onContentEvent={handleContentEvent}
          onConnectionStateChange={setConnectionState}
          onListeningChange={setIsListening}
          onSpeakingChange={setIsSpeaking}
        />
      </div>

      {/* Floating Voice Controls */}
      <div className="fixed bottom-6 right-6 z-50">
        <VoiceControls
          isConnected={connectionState === 'connected'}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onConnect={() => voiceChatRef.current?.connect()}
          onDisconnect={() => voiceChatRef.current?.disconnect()}
        />
      </div>
    </div>
  );
};
