import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HybridChatInterface } from './HybridChatInterface';
import { CleoVoiceChat } from './CleoVoiceChat';
import { LessonPlanSidebar } from './LessonPlanSidebar';
import { LessonResumeDialog } from './LessonResumeDialog';
import { LessonCompleteDialog } from './LessonCompleteDialog';
import { useContentSync } from '@/hooks/useContentSync';
import { useVoiceTimer } from '@/hooks/useVoiceTimer';
import { useTextChat } from '@/hooks/useTextChat';
import { useCleoLessonState } from '@/hooks/useCleoLessonState';
import { LessonData, ContentBlock, ContentEvent } from '@/types/lessonContent';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pause, CheckCircle } from 'lucide-react';
import { getSubjectTheme } from '@/utils/subjectTheming';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompactStepIndicator } from './CompactStepIndicator';
import { cleoQuestionTrackingService } from '@/services/cleoQuestionTrackingService';

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
  
  const lessonState = useCleoLessonState(conversationId || null);
  
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
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>(lessonData.content || []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allMessages, setAllMessages] = useState<CleoMessage[]>([]);
  
  const controlsRef = useRef<{ connect: () => void; disconnect: () => void; sendUserMessage: (text: string) => void } | null>(null);
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

  const handleVoiceLimitReached = () => {
    handleModeSwitch('text', true);
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-8 lg:px-12 py-6 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToModule}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>

            <div className="flex items-center gap-2">
              {lessonPlan && (
                <CompactStepIndicator
                  teachingSequence={lessonPlan.teaching_sequence}
                  currentStepId={activeStep?.toString()}
                  completedSteps={completedSteps}
                />
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseLesson}
                disabled={connectionState !== 'connected'}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>

              {allStepsCompleted && (
                <Button
                  onClick={handleCompleteLesson}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Lesson
                </Button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <span className="text-4xl">{subjectTheme.emoji}</span>
              {lessonData.title}
            </h1>
            <p className="text-muted-foreground">
              {lessonData.topic} • {lessonData.yearGroup}
            </p>
          </div>
        </div>

        {/* Hybrid Chat Interface */}
        <div className="flex-1">
        <HybridChatInterface
          mode={mode}
          messages={allMessages}
          isVoiceConnected={connectionState === 'connected'}
          isVoiceListening={isListening}
          isVoiceSpeaking={isSpeaking}
          isTextLoading={textChat.isLoading}
          voiceTimePercent={voiceTimer.percentUsed}
          voiceTimeRemaining={voiceTimer.remainingSeconds}
          onModeSwitch={(newMode) => handleModeSwitch(newMode, false)}
          onVoiceConnect={handleVoiceConnect}
          onVoiceDisconnect={handleVoiceDisconnect}
          onTextSend={textChat.sendMessage}
          canUseVoice={!voiceTimer.hasReachedLimit}
          contentBlocks={content}
          visibleContentIds={visibleContent}
          onAnswerQuestion={(qId, aId, correct) => {
            console.log('Question answered:', { qId, aId, correct });
          }}
          conversationId={conversationId || null}
          onContentAction={(contentId, action, message) => {
            console.log('Content action:', { contentId, action, message });
            // Send the action message to Cleo
            controlsRef.current?.sendUserMessage(message);
          }}
        />
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
          onProvideControls={(controls) => {
            controlsRef.current = controls;
          }}
          voiceTimer={voiceTimer}
          onVoiceLimitReached={handleVoiceLimitReached}
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
    </div>
  );
};
