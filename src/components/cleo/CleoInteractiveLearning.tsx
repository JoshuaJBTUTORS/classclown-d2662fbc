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
  const voiceChatInstanceRef = React.useRef<any>(null);

  const handleAnswerQuestion = (
    questionId: string,
    answerId: string,
    isCorrect: boolean
  ) => {
    console.log('📝 Answer submitted:', { questionId, answerId, isCorrect });
    // The answer will be sent via the voice chat component
  };

  // Check if we have minimal or no content
  const hasMinimalContent = !lessonData.content || lessonData.content.length === 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
      {/* Lesson Progress Bar */}
      {lessonData.steps && lessonData.steps.length > 0 && (
        <LessonProgressBar
          steps={lessonData.steps}
          currentStep={activeStep}
          completedSteps={completedSteps}
        />
      )}

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

          {/* Minimal Content Fallback */}
          {hasMinimalContent ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to Learn with Cleo
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Click the button below to begin your lesson with Cleo about {lessonData.topic}.
                  Visual content will appear here as you learn.
                </p>
                
                {/* Voice Controls */}
                <VoiceControls
                  isConnected={connectionState === 'connected'}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onConnect={() => {
                    // TODO: Implement connection trigger
                    console.log('Connect triggered');
                  }}
                  onDisconnect={() => {
                    // TODO: Implement disconnect trigger
                    console.log('Disconnect triggered');
                  }}
                />
              </div>
            </div>
          ) : (
            <ContentDisplay
              content={lessonData.content}
              visibleContent={visibleContent}
              onAnswerQuestion={handleAnswerQuestion}
            />
          )}

        </div>
      </div>

      {/* Hidden Voice Chat Component */}
      <div className="hidden">
        <CleoVoiceChat
          conversationId={conversationId}
          topic={lessonData.topic}
          yearGroup={lessonData.yearGroup}
          onContentEvent={handleContentEvent}
          onConnectionStateChange={setConnectionState}
          onListeningChange={setIsListening}
          onSpeakingChange={setIsSpeaking}
        />
      </div>

    </div>
  );
};
