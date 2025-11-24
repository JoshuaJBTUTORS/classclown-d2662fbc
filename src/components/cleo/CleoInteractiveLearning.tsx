import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HybridChatInterface } from './HybridChatInterface';
import { CleoVoiceChat } from './CleoVoiceChat';
import { LessonPlanSidebar } from './LessonPlanSidebar';
import { LessonResumeDialog } from './LessonResumeDialog';
import { LessonCompleteDialog } from './LessonCompleteDialog';
import { AssignPracticeDialog } from './AssignPracticeDialog';
import { LessonProgressIndicator } from './LessonProgressIndicator';
import { useContentSync } from '@/hooks/useContentSync';
import { useTextChat } from '@/hooks/useTextChat';
import { useCleoLessonState } from '@/hooks/useCleoLessonState';
import CleoAvatar from './CleoAvatar';
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
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { MinuteUsageTracker } from '@/components/voice/MinuteUsageTracker';

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
  
  const sessionDuration = 15; // minutes
  
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

  const textChat = useTextChat(conversationId || null);
  
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [questionStats, setQuestionStats] = useState<any>(null);
  const [sessionStartTime] = useState(Date.now());
  
  // PHASE 3: Goodbye loop detection (safety net)
  const goodbyeCounter = useRef(0);
  const recentMessages = useRef<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  const [mode, setMode] = useState<ChatMode>('voice');
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>(lessonData.content || []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allMessages, setAllMessages] = useState<CleoMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const hasLoadedMessagesRef = useRef(false);
  
  const controlsRef = useRef<{ 
    connect: () => void; 
    disconnect: () => void; 
    sendUserMessage: (text: string) => void; 
    toggleMute?: () => void; 
    isMuted?: boolean;
  } | null>(null);
  const hasDisconnectedOnComplete = useRef(false);
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

  // Load messages on mount and subscribe to real-time updates
  useEffect(() => {
    console.log('🔄 Effect triggered. ConversationID:', currentConversationId, 'Mode:', mode, 'HasLoaded:', hasLoadedMessagesRef.current);
    
    if (!currentConversationId) {
      console.log('⚠️ No conversation ID yet');
      if (mode === 'voice') {
        // Add initial welcome message for voice mode
        const welcomeMessage: CleoMessage = {
          id: crypto.randomUUID(),
          conversation_id: '',
          role: 'assistant',
          content: `Welcome! 🎓 Click 'Start Learning' below to begin your voice lesson on ${lessonData.topic}.`,
          mode: 'voice',
          created_at: new Date().toISOString(),
        };
        setAllMessages([welcomeMessage]);
      }
      return;
    }

    console.log('📝 Loading messages for conversation:', currentConversationId);
    hasLoadedMessagesRef.current = true;

    // Load existing messages
    const loadMessages = async () => {
      console.log('🔍 Fetching messages from database...');
      const { data, error } = await supabase
        .from('cleo_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }

      console.log('✅ Database query successful. Found', data?.length || 0, 'messages');
      if (data) {
        const mappedMessages = data.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          mode: (msg.mode || 'voice') as ChatMode,
          duration_seconds: msg.duration_seconds,
          created_at: msg.created_at,
        }));
        console.log('📝 Setting messages to state. Count:', mappedMessages.length);
        setAllMessages(mappedMessages);
      }
    };

    loadMessages();

    // Subscribe to real-time message updates
    console.log('📡 Setting up real-time subscription for:', currentConversationId);
    const channel = supabase
      .channel(`messages:${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cleo_messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          console.log('📥 New message received via realtime:', payload.new);
          const newMessage = payload.new as any;
          setAllMessages(prev => {
            const updated = [...prev, {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              role: newMessage.role,
              content: newMessage.content,
              mode: newMessage.mode || 'voice',
              duration_seconds: newMessage.duration_seconds,
              created_at: newMessage.created_at,
            }];
            console.log('📝 Updated messages. New count:', updated.length);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [currentConversationId, mode, lessonData.topic]);

  // PHASE 3: Goodbye loop detection (safety net)
  useEffect(() => {
    if (connectionState !== 'connected' || allMessages.length < 2) return;

    const isGoodbyeMessage = (content: string) => {
      const lowerContent = content.toLowerCase();
      return (
        lowerContent.includes('bye') ||
        lowerContent.includes('goodbye') ||
        lowerContent.includes('see you') ||
        lowerContent.includes('take care') ||
        lowerContent === 'you too!' ||
        lowerContent === 'thanks!'
      );
    };

    // Check the last 10 messages for goodbye patterns
    const recentMsgs = allMessages.slice(-10);
    const goodbyeMessages = recentMsgs.filter(msg => isGoodbyeMessage(msg.content));
    
    // Count consecutive goodbyes from both user and assistant
    let consecutiveGoodbyes = 0;
    for (let i = recentMsgs.length - 1; i >= 0; i--) {
      if (isGoodbyeMessage(recentMsgs[i].content)) {
        consecutiveGoodbyes++;
      } else {
        break;
      }
    }

    if (consecutiveGoodbyes >= 4) {
      console.log('🚨 GOODBYE LOOP DETECTED! Force disconnecting...');
      console.log('🚨 Consecutive goodbyes:', consecutiveGoodbyes);
      console.log('🚨 Recent messages:', recentMsgs.map(m => `${m.role}: ${m.content}`));
      
      handleVoiceDisconnect();
      
      toast({
        title: "Session Ended 👋",
        description: "Goodbye! Hope you enjoyed the lesson.",
      });
    }
  }, [allMessages, connectionState]);



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

    // Disconnect voice if switching away
    if (mode === 'voice' && connectionState === 'connected') {
      await controlsRef.current?.disconnect();
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

  const handleContentEventWithUpsert = async (event: ContentEvent) => {
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
    } else if (event.type === 'lesson_complete') {
      console.log('🎓 ========== LESSON_COMPLETE EVENT RECEIVED ==========');
      console.log('🎓 Summary:', event.summary);
      
      // First, forward to handleContentEvent to mark all steps complete
      handleContentEvent(event);
      
      // Then trigger lesson completion (saves state, disconnects voice, shows dialog)
      await handleCompleteLesson();
      console.log('🎓 Completion dialog opened and voice disconnected');
    } else {
      handleContentEvent(event);
    }
  };

  const handleVoiceConnect = () => {
    if (mode === 'voice') {
      hasDisconnectedOnComplete.current = false; // Reset flag for reconnection
      controlsRef.current?.connect();
    }
  };

  const handleVoiceDisconnect = async () => {
    await controlsRef.current?.disconnect();
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
    
    // PHASE 4: Wait 5 seconds for Cleo's closing audio to finish
    console.log('🎓 Waiting 5 seconds for closing audio before disconnecting...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // CRITICAL: Disconnect voice session to stop OpenAI charges
    if (connectionState === 'connected') {
      console.log('🔌 Disconnecting voice session on lesson completion...');
      await handleVoiceDisconnect();
      
      toast({
        title: "Voice Session Ended",
        description: "Connection closed to save costs.",
      });
    }
    
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

  // Auto-disconnect when lesson completes to save costs
  useEffect(() => {
    if (allStepsCompleted && connectionState === 'connected' && !hasDisconnectedOnComplete.current) {
      hasDisconnectedOnComplete.current = true;
      console.log('🎓 All steps completed - auto-disconnecting voice session');
      handleVoiceDisconnect();
      
      toast({
        title: "Lesson Complete! 🎉",
        description: "Voice session ended automatically. Choose to continue or finish up.",
      });
      
      // CRITICAL: Ensure completion dialog shows even if complete_lesson wasn't called
      console.log('🎓 Opening completion dialog (fallback for missing complete_lesson call)');
      setShowCompleteDialog(true);
    }
  }, [allStepsCompleted, connectionState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = async () => {
    // If voice session is active, show warning
    if (connectionState === 'connected') {
      const confirmed = window.confirm(
        "You're currently in a lesson. Going back will pause your progress. Continue?"
      );
      
      if (!confirmed) return;
      
      // Disconnect and pause
      await handleVoiceDisconnect();
      await handlePauseLesson();
    } else {
      // No active session, just navigate back
      handleBackToModule();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 max-w-[1120px] mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackClick}
            className="cleo-back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="cleo-logo">
            Cleo 🧑🏻‍🔬
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <LessonProgressIndicator
            totalSteps={lessonData.steps.length}
            completedSteps={completedSteps}
            activeStep={activeStep}
          />
          
          {/* Show real-time usage during voice session */}
          {connectionState === 'connected' && (
            <MinuteUsageTracker sessionStartTime={new Date(sessionStartTime)} />
          )}
          
          {/* Show available minutes quota */}
          <VoiceSessionIndicator />
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
                onVoiceConnect={handleVoiceConnect}
                onVoiceDisconnect={handleVoiceDisconnect}
                onTextSend={textChat.sendMessage}
                contentBlocks={content}
                visibleContentIds={visibleContent}
                onAnswerQuestion={async (qId, aId, correct) => {
                  console.log('Question answered:', { qId, aId, correct });
                  
                  // Find the question and answer text
                  const questionBlock = content.find(b => b.id === qId);
                  const questionData = questionBlock?.data as any;
                  const answerText = questionData?.options?.find((o: any) => o.id === aId)?.text || '';
                  
                  // Send answer info to OpenAI so Cleo knows what was answered
                  const answerMessage = correct 
                    ? `The student answered correctly: "${answerText}". Acknowledge this briefly and continue teaching.`
                    : `The student answered incorrectly: "${answerText}". Provide gentle correction and explanation.`;
                  
                  if (connectionState === 'connected') {
                    controlsRef.current?.sendUserMessage(answerMessage);
                  }
                  
                  // Record answer and award coins
                  if (conversationId && questionBlock) {
                    try {
                      await cleoQuestionTrackingService.recordQuestionAnswer({
                        conversation_id: conversationId,
                        question_id: qId,
                        question_text: questionData?.question || '',
                        answer_id: aId,
                        answer_text: answerText,
                        is_correct: correct,
                        time_taken_seconds: undefined,
                        step_id: questionBlock.stepId || '',
                      });
                      
                      // Show success notification for correct answers
                      if (correct) {
                        toast({
                          title: '🪙 +2 coins earned!',
                          description: 'Keep going to unlock mastery levels!',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to record question answer:', error);
                      toast({
                        title: 'Failed to save your answer',
                        description: 'Your progress may not be tracked',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
                onAskHelp={(qId, questionText) => {
                  const helpMessage = `Can you help me with this question: "${questionText}"`;
                  controlsRef.current?.sendUserMessage(helpMessage);
                  toast({
                    title: "Asked Cleo for help",
                    description: "Cleo will guide you through the question",
                  });
                }}
                conversationId={conversationId || null}
                onContentAction={(contentId, action, message) => {
                  console.log('Content action:', { contentId, action, message });
                  controlsRef.current?.sendUserMessage(message);
                }}
                onToggleMute={() => controlsRef.current?.toggleMute?.()}
                isMuted={isMuted}
                isConnecting={connectionState === 'connecting'}
              />
            </div>
          </section>

          {/* Right Column - Cleo Panel */}
          <aside className="cleo-panel">
            <div>
              <CleoAvatar 
                isSpeaking={isSpeaking}
                isListening={isListening}
                isMuted={isMuted}
                size="large"
              />
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

            {/* Conversation Transcript */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">📝 Conversation Transcript</h3>
              </div>
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-4">
                {allMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Your conversation with Cleo will appear here...
                  </div>
                ) : (
                  <TranscriptPanel 
                    messages={allMessages}
                    isVoiceSpeaking={isSpeaking}
                  />
                )}
              </div>
            </div>

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
                <div className="flex flex-col gap-2 w-full mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">
                      Lesson Complete! 🎉
                    </span>
                  </div>
                  
                  {connectionState === 'disconnected' && (
                    <Button
                      onClick={() => {
                        hasDisconnectedOnComplete.current = false;
                        handleVoiceConnect();
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Continue & Ask Questions
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleCompleteLesson}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Done - Finish Lesson
                  </Button>
                </div>
              )}
            </div>
          </aside>
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
          conversationId={currentConversationId}
          topic={lessonData.topic}
          yearGroup={lessonData.yearGroup}
          lessonPlan={lessonPlan}
          onContentEvent={handleContentEventWithUpsert}
          onConnectionStateChange={setConnectionState}
          onListeningChange={setIsListening}
          onSpeakingChange={setIsSpeaking}
          onConversationCreated={(id) => {
            console.log('🎯 Conversation created, setting ID:', id);
            console.log('🎯 Current state before update:', currentConversationId);
            setCurrentConversationId(id);
            console.log('🎯 State update triggered for:', id);
          }}
          onProvideControls={(controls) => {
            controlsRef.current = controls;
            if (controls.isMuted !== undefined) {
              setIsMuted(controls.isMuted);
            }
          }}
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
        onAssignPractice={() => setShowPracticeDialog(true)}
        questionStats={questionStats}
        totalTimeMinutes={sessionTimeMinutes}
        lessonTitle={lessonData.title}
        conversationId={conversationId}
      />

      {/* Practice Dialog */}
      {conversationId && (
        <AssignPracticeDialog
          isOpen={showPracticeDialog}
          onClose={() => setShowPracticeDialog(false)}
          incorrectTopics={questionStats?.incorrect_answers > 0 ? ['Review incorrect answers'] : []}
          conversationId={conversationId}
        />
      )}
    </div>
  );
};
