import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HybridChatInterface } from './HybridChatInterface';
import { CleoVoiceChat } from './CleoVoiceChat';
import { LessonPlanSidebar } from './LessonPlanSidebar';
import { LessonResumeDialog } from './LessonResumeDialog';
import { LessonCompleteDialog } from './LessonCompleteDialog';
import { ReconnectionDialog } from './ReconnectionDialog';
import { useContentSync } from '@/hooks/useContentSync';
import { useVoiceTimer } from '@/hooks/useVoiceTimer';
import { useTextChat } from '@/hooks/useTextChat';
import { useCleoLessonState } from '@/hooks/useCleoLessonState';
import { LessonData, ContentBlock, ContentEvent } from '@/types/lessonContent';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pause, CheckCircle, Trophy } from 'lucide-react';
import { getSubjectTheme } from '@/utils/subjectTheming';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompactStepIndicator } from './CompactStepIndicator';
import { cleoQuestionTrackingService } from '@/services/cleoQuestionTrackingService';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { TranscriptPanel } from './TranscriptPanel';
import { QuickChatInput } from './QuickChatInput';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { detectTeachingMode } from '@/utils/teachingModeDetection';

interface CleoInteractiveLearningProps {
  lessonData: LessonData;
  conversationId?: string;
  moduleId?: string;
  courseId?: string;
  lessonPlan?: {
    id?: string;
    topic: string;
    year_group: string;
    learning_objectives: string[];
    teaching_sequence: Array<{
      id: string;
      title: string;
      duration_minutes?: number;
    }>;
  };
}

export const CleoInteractiveLearning: React.FC<CleoInteractiveLearningProps> = ({
  lessonData,
  conversationId,
  moduleId,
  courseId,
  lessonPlan,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const subjectTheme = getSubjectTheme(lessonData.topic, lessonData.yearGroup);
  const { selectedMicrophone, selectedSpeaker } = useAudioDevices();
  
  const lessonState = useCleoLessonState(conversationId || null);
  
  // Detect teaching mode
  const teachingMode = useMemo(() => {
    const subject = lessonData.topic || lessonPlan?.topic || '';
    const yearGrp = lessonData.yearGroup || lessonPlan?.year_group || '';
    return detectTeachingMode(subject, yearGrp);
  }, [lessonData, lessonPlan]);

  const isExamPractice = teachingMode === 'exam_practice';
  const sessionDuration = isExamPractice ? 30 : 15; // minutes
  
  const {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    handleContentEvent,
    setActiveStep,
    setVisibleContent,
    setCompletedSteps,
  } = useContentSync(lessonData, (state) => {
    // Auto-save state changes
    if (conversationId && connectionState === 'connected') {
      const totalSteps = lessonData.steps.length;
      const completionPercentage = totalSteps > 0 
        ? Math.round((state.completedSteps.length / totalSteps) * 100)
        : 0;
      
      lessonState.debouncedSave({
        conversation_id: conversationId,
        lesson_plan_id: lessonPlan?.id,
        active_step: state.activeStep,
        visible_content_ids: state.visibleContent,
        completed_steps: state.completedSteps,
        completion_percentage: completionPercentage,
      });
    }
  });

  const voiceTimer = useVoiceTimer(conversationId || null);
  const textChat = useTextChat(conversationId || null);
  
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [questionStats, setQuestionStats] = useState<any>(null);
  const [sessionStartTime] = useState(Date.now());

  const [mode, setMode] = useState<ChatMode>('voice');
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>(lessonData.content || []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allMessages, setAllMessages] = useState<CleoMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTimestamp, setPauseTimestamp] = useState<number | null>(null);
  const [currentModel, setCurrentModel] = useState<'mini' | 'full'>('mini');
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [currentAttemptCount, setCurrentAttemptCount] = useState(0);
  const [disconnectionInfo, setDisconnectionInfo] = useState<any>(null);
  
  const controlsRef = useRef<{ 
    connect: () => void; 
    disconnect: () => void; 
    sendUserMessage: (text: string) => void;
    attemptReconnect?: () => void; // Make optional since it's added later
  } | null>(null);
  const modeSwitchCountRef = useRef(0);

  // Check for saved state and show resume dialog
  useEffect(() => {
    const checkSavedState = async () => {
      if (conversationId && lessonState.savedState) {
        const state = lessonState.savedState;
        if (state.paused_at && !state.completed_at) {
          setShowResumeDialog(true);
        } else if (state.active_step || state.visible_content_ids.length > 0) {
          // Auto-resume if not explicitly paused
          setActiveStep(state.active_step);
          setVisibleContent(state.visible_content_ids);
          setCompletedSteps(state.completed_steps);
        }
      }
    };
    checkSavedState();
  }, [conversationId, lessonState.savedState]);

  // Load messages on mount and add initial welcome message in voice mode
  useEffect(() => {
    if (conversationId) {
      textChat.loadMessages();
    } else if (mode === 'voice') {
      // Add initial welcome message for voice mode
      const welcomeMessage: CleoMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: `Welcome! 🎓 Click 'Start Learning' below to begin your voice lesson on ${lessonData.topic}.`,
        mode: 'voice',
        created_at: new Date().toISOString(),
      };
      setAllMessages([welcomeMessage]);
    }
  }, [conversationId]);

  // Sync messages from text chat
  useEffect(() => {
    setAllMessages(textChat.messages);
  }, [textChat.messages]);

  // Auto-switch to text when voice limit reached
  useEffect(() => {
    if (voiceTimer.hasReachedLimit && mode === 'voice') {
      handleModeSwitch('text', true);
      toast({
        title: '✅ Switched to Text Mode',
        description: 'Voice time limit reached. Continue learning with text!',
      });
    }
  }, [voiceTimer.hasReachedLimit, mode]);

  // Show warning at 80%
  useEffect(() => {
    if (voiceTimer.shouldShowWarning && mode === 'voice') {
      toast({
        title: '⚠️ Voice Time Warning',
        description: `${voiceTimer.formatTime(voiceTimer.remainingSeconds)} remaining`,
        variant: 'default',
      });
    }
  }, [voiceTimer.shouldShowWarning]);

  const handleBackToModule = () => {
    if (courseId && moduleId) {
      navigate(`/course/${courseId}/module/${moduleId}`);
    } else if (moduleId) {
      navigate(`/module/${moduleId}`);
    } else {
      navigate(-1);
    }
  };

  const handleModeSwitch = async (newMode: ChatMode, isAuto: boolean = false) => {
    if (newMode === mode) return;
    
    // Don't allow switching to voice if limit reached
    if (newMode === 'voice' && voiceTimer.hasReachedLimit) {
      toast({
        title: 'Voice Limit Reached',
        description: 'You have used all 15 minutes of voice time for this lesson.',
        variant: 'destructive',
      });
      return;
    }

    // Disconnect voice if switching away
    if (mode === 'voice' && connectionState === 'connected') {
      controlsRef.current?.disconnect();
    }

    setMode(newMode);
    modeSwitchCountRef.current += 1;

    // Update conversation mode switches count (will work after types refresh)
    if (conversationId) {
      await supabase
        .from('cleo_conversations')
        .update({ mode_switches: modeSwitchCountRef.current } as any)
        .eq('id', conversationId);
    }

    // Show transition message
    const transitionMessage: CleoMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'assistant',
      content: isAuto
        ? newMode === 'text'
          ? "We've switched to text mode since we've used up our voice time. Let's continue learning!"
          : "Let's switch back to voice for this next part!"
        : newMode === 'text'
        ? "Great! Let's practice with some questions. Type your answers below."
        : "Perfect! Let me explain this next part with voice.",
      mode: newMode,
      created_at: new Date().toISOString(),
    };

    setAllMessages(prev => [...prev, transitionMessage]);

    toast({
      title: `Switched to ${newMode === 'voice' ? 'Voice' : 'Text'} Mode`,
      description: newMode === 'voice' 
        ? 'Voice conversation activated' 
        : 'Type your messages below',
    });
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

  const handleVoiceConnect = () => {
    if (mode === 'voice') {
      controlsRef.current?.connect();
    }
  };

  const handleVoiceDisconnect = () => {
    controlsRef.current?.disconnect();
  };

  const handlePauseVoice = () => {
    controlsRef.current?.disconnect();
    setIsPaused(true);
    setPauseTimestamp(Date.now());
    toast({
      title: "⏸️ Voice Paused",
      description: "Your voice time is paused. Click Resume to continue.",
    });
  };

  const handleResumeVoice = () => {
    setIsPaused(false);
    setPauseTimestamp(null);
    controlsRef.current?.connect();
    toast({
      title: "▶️ Voice Resumed",
      description: "Let's continue learning!",
    });
  };

  const handleVoiceLimitReached = () => {
    handleModeSwitch('text', true);
  };

  const handleUnexpectedDisconnection = (info: any) => {
    console.log('🚨 Unexpected disconnection:', info);
    setDisconnectionInfo(info);
    setShowReconnectDialog(true);
    voiceTimer.pause();
  };

  const handleReconnectAttempt = async () => {
    console.log('🔄 Manual reconnection triggered');
    try {
      await controlsRef.current?.attemptReconnect?.();
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      handleReconnectFailed();
    }
  };

  const handleReconnectSuccess = () => {
    console.log('✅ Reconnection successful');
    setShowReconnectDialog(false);
    setCurrentAttemptCount(0);
    voiceTimer.start();
    toast({
      title: "✅ Reconnected Successfully",
      description: "Your session has been restored. Let's continue!",
    });
  };

  const handleReconnectFailed = () => {
    console.log('❌ Reconnection failed - switching to text mode');
    setShowReconnectDialog(false);
    setCurrentAttemptCount(0);
    handleModeSwitch('text', true);
    toast({
      title: "⚠️ Switched to Text Mode",
      description: "Voice connection couldn't be restored. Continue with text chat.",
      variant: "destructive",
    });
  };

  const handleEndSession = () => {
    console.log('🛑 User ended session from reconnection dialog');
    setShowReconnectDialog(false);
    setCurrentAttemptCount(0);
    handlePauseLesson();
  };

  const handleResumeLesson = async () => {
    const state = await lessonState.resumeLesson();
    if (state) {
      setActiveStep(state.active_step);
      setVisibleContent(state.visible_content_ids);
      setCompletedSteps(state.completed_steps);
    }
    setShowResumeDialog(false);
  };

  const handleRestartLesson = async () => {
    await lessonState.clearState();
    setActiveStep(0);
    setVisibleContent([]);
    setCompletedSteps([]);
    setShowResumeDialog(false);
  };

  const handlePauseLesson = async () => {
    if (!conversationId) return;
    
    const totalSteps = lessonData.steps.length;
    const completionPercentage = totalSteps > 0 
      ? Math.round((completedSteps.length / totalSteps) * 100)
      : 0;
    
    await lessonState.pauseLesson({
      conversation_id: conversationId,
      lesson_plan_id: lessonPlan?.id,
      active_step: activeStep,
      visible_content_ids: visibleContent,
      completed_steps: completedSteps,
      completion_percentage: completionPercentage,
    });
    
    handleBackToModule();
  };

  const handleCompleteLesson = async () => {
    if (!conversationId) return;
    
    const totalSteps = lessonData.steps.length;
    
    await lessonState.completeLesson({
      conversation_id: conversationId,
      lesson_plan_id: lessonPlan?.id,
      active_step: activeStep,
      visible_content_ids: visibleContent,
      completed_steps: completedSteps,
      completion_percentage: 100,
    });
    
    // Get question stats
    const stats = await cleoQuestionTrackingService.getQuestionStats(conversationId);
    setQuestionStats(stats);
    setShowCompleteDialog(true);
  };

  const allStepsCompleted = completedSteps.length === lessonData.steps.length;
  const sessionTimeMinutes = Math.round((Date.now() - sessionStartTime) / 60000);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 max-w-[1120px] mx-auto">
        <div className="cleo-logo">
          Cleo {isExamPractice ? '📝' : '🧑🏻‍🔬'}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
          <span>⏱️</span>
          <span>{formatTime(voiceTimer.remainingSeconds)} remaining</span>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="cleo-interactive-wrapper">
        <div className="cleo-layout">
          
          {/* Left Column - Lesson Content */}
          <section className="cleo-lesson-card">
            <div className="cleo-lesson-title">{lessonData.title}</div>
            <div className="cleo-lesson-subtitle">{lessonData.topic}</div>

            {lessonPlan && lessonPlan.learning_objectives.length > 0 && (
              <div className="cleo-lesson-body">
                {lessonPlan.learning_objectives[0]}
              </div>
            )}

            {/* Content Display Area */}
            <div className="mt-6">
              <HybridChatInterface
                mode={mode}
                messages={allMessages}
                isVoiceConnected={connectionState === 'connected'}
                isVoiceListening={isListening}
                isVoiceSpeaking={isSpeaking}
                isTextLoading={textChat.isLoading}
                isPaused={isPaused}
                currentModel={currentModel}
                onVoiceConnect={handleVoiceConnect}
                onVoiceDisconnect={handleVoiceDisconnect}
                onVoicePause={handlePauseVoice}
                onVoiceResume={handleResumeVoice}
                onTextSend={textChat.sendMessage}
                contentBlocks={content}
                visibleContentIds={visibleContent}
                onAnswerQuestion={(qId, aId, correct) => {
                  console.log('Question answered:', { qId, aId, correct });
                }}
                onAskHelp={(qId, questionText) => {
                  const helpMessage = `Can you help me with this question: "${questionText}"`;
                  controlsRef.current?.sendUserMessage(helpMessage);
                  toast({
                    title: "Asked Cleo for help",
                    description: "Cleo will guide you through the question",
                  });
                }}
                isExamPractice={isExamPractice}
                conversationId={conversationId || null}
                onContentAction={(contentId, action, message) => {
                  console.log('Content action:', { contentId, action, message });
                  controlsRef.current?.sendUserMessage(message);
                }}
              />
            </div>
          </section>

          {/* Right Column - Cleo Panel */}
          <aside className="cleo-panel">
            <div>
              <div className="cleo-avatar-large-new">🧑🏻‍🔬</div>
              <div className="cleo-status-pill">
                <span className="cleo-status-dot"></span>
                <span>{isSpeaking ? 'Cleo is speaking…' : 'Ready to help'}</span>
              </div>
            </div>

            {allMessages.length > 0 && allMessages[allMessages.length - 1].role === 'assistant' && (
              <div className="cleo-panel-text">
                {allMessages[allMessages.length - 1].content}
              </div>
            )}

            {/* Progress Card */}
            {lessonPlan && lessonPlan.teaching_sequence && (
              <div className="cleo-progress-card-new">
                <div className="cleo-progress-title">Lesson Progress</div>
                {lessonPlan.teaching_sequence.map((step, index) => (
                  <div key={step.id || index} className="cleo-progress-item">
                    <span className={`cleo-progress-dot-new ${completedSteps.includes(step.id) ? 'done' : ''}`}></span>
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Voice Input Bar */}
            <div className="cleo-voice-bar">
              <span>Ask Cleo anything…</span>
              <span className="mic">🎙️</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseLesson}
                disabled={connectionState !== 'connected' && mode !== 'text'}
                className="flex-1"
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>

              {allStepsCompleted && (
                <Button
                  onClick={handleCompleteLesson}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  size="sm"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </Button>
              )}
            </div>
          </aside>

          {/* Mobile: Floating Transcript Button */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden fixed bottom-20 right-4 z-50">
              <Button 
                size="icon" 
                className="rounded-full shadow-lg h-14 w-14"
                style={{ background: 'hsl(var(--cleo-green))' }}
              >
                <MessageSquare className="w-6 h-6 text-white" />
                {allMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
                    {allMessages.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="cleo-avatar-tiny">🧑🏻‍🔬</div>
                  Conversation with Cleo
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 h-[calc(100%-120px)] overflow-y-auto">
                <TranscriptPanel messages={allMessages} isVoiceSpeaking={isSpeaking} />
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white pt-4 border-t">
                <QuickChatInput 
                  onSend={(msg) => {
                    if (mode === 'text') {
                      textChat.sendMessage(msg);
                    } else {
                      controlsRef.current?.sendUserMessage(msg);
                    }
                  }}
                  disabled={connectionState !== 'connected' && mode !== 'text'}
                  placeholder="Ask Cleo anything..."
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Lesson Plan Sidebar */}
      {lessonPlan && connectionState === 'connected' && (
        <LessonPlanSidebar
          lessonPlan={lessonPlan}
          currentStepId={activeStep?.toString()}
          completedSteps={completedSteps}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Hidden Voice Chat Component */}
      <div className="hidden">
        <CleoVoiceChat
          conversationId={conversationId}
          topic={lessonData.topic}
          yearGroup={lessonData.yearGroup}
          lessonPlan={lessonPlan}
          onContentEvent={handleContentEventWithUpsert}
          onConnectionStateChange={setConnectionState}
          onListeningChange={setIsListening}
          onSpeakingChange={setIsSpeaking}
          onModelChange={setCurrentModel}
          onProvideControls={(controls) => {
            controlsRef.current = controls;
          }}
          voiceTimer={voiceTimer}
          onVoiceLimitReached={handleVoiceLimitReached}
          onUnexpectedDisconnection={handleUnexpectedDisconnection}
          onReconnectSuccess={handleReconnectSuccess}
          onReconnectFailed={handleReconnectFailed}
          selectedMicrophoneId={selectedMicrophone?.deviceId}
          selectedSpeakerId={selectedSpeaker?.deviceId}
        />
      </div>

      {/* Resume Dialog */}
      <LessonResumeDialog
        isOpen={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
        onResume={handleResumeLesson}
        onRestart={handleRestartLesson}
        savedState={lessonState.savedState}
      />

      {/* Complete Dialog */}
      <LessonCompleteDialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onReturnToCourse={handleBackToModule}
        questionStats={questionStats}
        totalTimeMinutes={sessionTimeMinutes}
        lessonTitle={lessonData.title}
      />

      {/* Reconnection Dialog */}
      <ReconnectionDialog
        open={showReconnectDialog}
        onReconnect={handleReconnectAttempt}
        onEndSession={handleEndSession}
        attemptCount={currentAttemptCount}
        maxAttempts={3}
        isReconnecting={connectionState === 'reconnecting' || currentAttemptCount > 0}
      />
    </div>
  );
};
