import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HybridChatInterface } from './HybridChatInterface';
import { CleoVoiceChat } from './CleoVoiceChat';
import { LessonPlanSidebar } from './LessonPlanSidebar';
import { useContentSync } from '@/hooks/useContentSync';
import { useVoiceTimer } from '@/hooks/useVoiceTimer';
import { useTextChat } from '@/hooks/useTextChat';
import { LessonData, ContentBlock, ContentEvent } from '@/types/lessonContent';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getSubjectTheme } from '@/utils/subjectTheming';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CleoInteractiveLearningProps {
  lessonData: LessonData;
  conversationId?: string;
  moduleId?: string;
  lessonPlan?: {
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
  lessonPlan,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const subjectTheme = getSubjectTheme(lessonData.topic, lessonData.yearGroup);
  
  const {
    activeStep,
    visibleContent,
    completedSteps,
    showContent,
    handleContentEvent,
  } = useContentSync(lessonData);

  const voiceTimer = useVoiceTimer(conversationId || null);
  const textChat = useTextChat(conversationId || null);

  const [mode, setMode] = useState<ChatMode>('voice');
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'disconnected'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [content, setContent] = useState<ContentBlock[]>(lessonData.content || []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allMessages, setAllMessages] = useState<CleoMessage[]>([]);
  
  const controlsRef = useRef<{ connect: () => void; disconnect: () => void } | null>(null);
  const modeSwitchCountRef = useRef(0);

  // Load messages on mount
  useEffect(() => {
    if (conversationId) {
      textChat.loadMessages();
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
    if (moduleId) {
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-8 lg:px-12 py-6 border-b border-border">
          <Button
            variant="ghost"
            onClick={handleBackToModule}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>

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
    </div>
  );
};
