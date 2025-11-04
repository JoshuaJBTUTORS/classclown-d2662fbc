import React, { useState, useEffect, useRef } from 'react';
import { ContentDisplay } from './ContentDisplay';
import { VoiceControls } from './VoiceControls';
import { CleoVoiceChat } from './CleoVoiceChat';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { useContentSync } from '@/hooks/useContentSync';
import { LessonData, ContentBlock, ContentEvent } from '@/types/lessonContent';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface CleoInteractiveLearningProps {
  lessonData: LessonData;
  conversationId?: string;
  lessonPlanId?: string;
}

export const CleoInteractiveLearning: React.FC<CleoInteractiveLearningProps> = ({
  lessonData,
  conversationId,
  lessonPlanId,
}) => {
  const {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    handleContentEvent,
  } = useContentSync(lessonData);

  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>(lessonData.content || []);
  const [inputDeviceId, setInputDeviceId] = useState<string>('default');
  const [outputDeviceId, setOutputDeviceId] = useState<string>('default');
  const controlsRef = useRef<{ connect: () => void; disconnect: () => void; pause: () => void; resume: () => void } | null>(null);

  const handleAnswerQuestion = (
    questionId: string,
    answerId: string,
    isCorrect: boolean
  ) => {
    console.log('📝 Answer submitted:', { questionId, answerId, isCorrect });
    // The answer will be sent via the voice chat component
  };

  const handleContentEventWithUpsert = (event: ContentEvent) => {
    if (event.type === 'upsert_content' && event.block) {
      console.log('🎨 Upserting content block:', event.block.id);
      setContent(prev => {
        const existingIndex = prev.findIndex(b => b.id === event.block!.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...event.block };
          return updated;
        }
        return [...prev, event.block!];
      });
      if (event.autoShow) {
        showContent(event.block.id);
      }
    } else {
      handleContentEvent(event);
    }
  };

  // Dev fallback: inject demo table after 2s if no dynamic content
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && connectionState === 'connected') {
      const timer = setTimeout(() => {
        const nonIntroVisible = visibleContent.filter(id => id !== content[0]?.id);
        if (nonIntroVisible.length === 0) {
          const demoTable: ContentBlock = {
            id: 'demo-table',
            stepId: lessonData.steps?.[1]?.id || lessonData.steps?.[0]?.id || 'main',
            type: 'table',
            data: { 
              headers: ['Concept', 'Meaning'], 
              rows: [
                ['Atom', 'Smallest unit of matter'], 
                ['Molecule', 'Two or more atoms bonded']
              ] 
            },
            visible: false,
          };
          setContent(prev => prev.some(b => b.id === demoTable.id) ? prev : [...prev, demoTable]);
          showContent('demo-table');
          console.log('📦 Demo table injected for testing');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, visibleContent, content, lessonData.steps, showContent]);

  // Check if we have content and if any is visible
  const hasContent = lessonData.content && lessonData.content.length > 0;
  const hasVisibleContent = visibleContent.length > 0;
  
  // Ensure first content is always shown (fallback if markers don't fire)
  const derivedVisible = hasVisibleContent 
    ? visibleContent 
    : (lessonData.content?.[0] ? [lessonData.content[0].id] : []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 md:px-8 lg:px-12 py-6">
          {/* Debug info (development only) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-muted-foreground mb-2 opacity-50">
              Content: {hasContent ? '✓' : '✗'} | Visible: {visibleContent.length} | Derived: {derivedVisible.length}
            </div>
          )}
          {/* Lesson Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {lessonData.title}
            </h1>
            <p className="text-muted-foreground">
              {lessonData.topic} • {lessonData.yearGroup}
            </p>
          </div>

          {/* Teaching Sequence - Show BEFORE starting */}
          {connectionState !== 'connected' && lessonData.steps?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Teaching Sequence</h2>
              <div className="space-y-3">
                {lessonData.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Display - Show AFTER starting */}
          {connectionState === 'connected' && hasContent && (
            <ContentDisplay
              content={content}
              visibleContent={derivedVisible}
              onAnswerQuestion={handleAnswerQuestion}
            />
          )}

          {/* Getting Started Message */}
          {connectionState !== 'connected' && (
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
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Begin your voice conversation with Cleo about {lessonData.topic}.
                  Detailed content will appear as you progress through the lesson.
                </p>
                
                <div className="max-w-md mx-auto mb-6">
                  <AudioDeviceSelector
                    onInputDeviceChange={setInputDeviceId}
                    onOutputDeviceChange={setOutputDeviceId}
                    disabled={['connected'].includes(connectionState)}
                  />
                </div>
                
                <Button
                  onClick={() => controlsRef.current?.connect()}
                  size="lg"
                  className="gap-2 px-6 py-6 text-base font-semibold shadow-xl"
                >
                  <Play className="w-5 h-5" />
                  Start Learning
                </Button>
              </div>
            </div>
          )}

          {/* Spacer for floating controls */}
          <div className="h-32" />
        </div>
      </div>

      {/* Hidden Voice Chat Component */}
      <div className="hidden">
        <CleoVoiceChat
          conversationId={conversationId}
          topic={lessonData.topic}
          yearGroup={lessonData.yearGroup}
          lessonPlanId={lessonPlanId}
          inputDeviceId={inputDeviceId}
          outputDeviceId={outputDeviceId}
          onContentEvent={handleContentEventWithUpsert}
          onConnectionStateChange={setConnectionState}
          onListeningChange={setIsListening}
          onSpeakingChange={setIsSpeaking}
          onPausedChange={setIsPaused}
          onProvideControls={(controls) => {
            controlsRef.current = controls;
          }}
        />
      </div>

      {/* Floating Voice Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]">
        <VoiceControls
          isConnected={connectionState === 'connected'}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          onConnect={() => {
            controlsRef.current?.connect();
          }}
          onDisconnect={() => {
            controlsRef.current?.disconnect();
          }}
          onPause={() => {
            controlsRef.current?.pause();
          }}
          onResume={() => {
            controlsRef.current?.resume();
          }}
        />
      </div>
    </div>
  );
};
