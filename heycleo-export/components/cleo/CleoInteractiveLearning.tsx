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
import { LessonData, ContentBlock, ContentEvent, AIMarkingResult } from '@/types/lessonContent';
import { ChatMode, CleoMessage } from '@/types/cleoTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pause, CheckCircle, Trophy, WifiOff } from 'lucide-react';
import { getSubjectTheme } from '@/utils/subjectTheming';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompactStepIndicator } from './CompactStepIndicator';
import { cleoQuestionTrackingService } from '@/services/cleoQuestionTrackingService';
import { ResumeState } from '@/services/cleoLessonStateService';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { TranscriptPanel } from './TranscriptPanel';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { MinuteUsageTracker } from '@/components/voice/MinuteUsageTracker';
import { VoiceSpeedControl } from './VoiceSpeedControl';
import { QuickPromptButtons } from './QuickPromptButtons';
import { WebRTCConnectionState } from '@/utils/RealtimeChat';
import { Loader2 } from 'lucide-react';

// NOTE: This is a partial export - see the original file for full implementation
// File location: src/components/cleo/CleoInteractiveLearning.tsx
// Total lines: ~1020

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
  lessonPlan
}) => {
  // This is a blueprint file - copy the full implementation from:
  // src/components/cleo/CleoInteractiveLearning.tsx
  
  // Key features implemented:
  // - Voice/Text mode switching
  // - Lesson state persistence
  // - Content sync with Cleo
  // - Resume dialog
  // - Completion dialog
  // - Goodbye loop detection
  // - WebRTC connection management
  // - Voice speed control
  // - Quick prompts
  
  return (
    <div className="flex h-screen">
      {/* See original file for full implementation */}
    </div>
  );
};
