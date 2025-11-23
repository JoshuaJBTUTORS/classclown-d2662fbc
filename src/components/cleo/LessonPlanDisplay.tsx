import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Target, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { lessonDurationEstimator } from '@/services/lessonDurationEstimator';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { supabase } from '@/integrations/supabase/client';

interface LessonPlanDisplayProps {
  lessonPlan: {
    topic: string;
    year_group: string;
    learning_objectives: string[];
    teaching_sequence: Array<{
      id: string;
      title: string;
      duration_minutes?: number;
    }>;
  };
  contentCounts: {
    tables: number;
    questions: number;
    definitions: number;
  };
  onStartLesson: () => void;
  moduleId?: string;
  courseId?: string;
}

export const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({
  lessonPlan,
  contentCounts,
  onStartLesson,
  moduleId,
  courseId
}) => {
  const navigate = useNavigate();
  const [hasQuota, setHasQuota] = useState(true);
  const [checkingQuota, setCheckingQuota] = useState(true);
  
  const { 
    audioInputs, 
    audioOutputs, 
    selectedMicrophone, 
    selectedSpeaker, 
    setMicrophone, 
    setSpeaker 
  } = useAudioDevices();

  const estimatedMinutes = useMemo(() => {
    return lessonDurationEstimator.estimateDuration(lessonPlan);
  }, [lessonPlan]);

  useEffect(() => {
    const checkQuota = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasQuota(false);
          return;
        }
        
        const now = new Date().toISOString();
        const { data } = await supabase
          .from('voice_session_quotas')
          .select('minutes_remaining, bonus_minutes')
          .eq('user_id', user.id)
          .lte('period_start', now)
          .gte('period_end', now)
          .single();
        
        const totalMinutes = (data?.minutes_remaining || 0) + (data?.bonus_minutes || 0);
        setHasQuota(totalMinutes > 0);
      } catch (error) {
        console.error('Error checking quota:', error);
        setHasQuota(false);
      } finally {
        setCheckingQuota(false);
      }
    };
    
    checkQuota();
  }, []);

  const handleBackToModule = () => {
    if (courseId && moduleId) {
      navigate(`/course/${courseId}/module/${moduleId}`);
    } else if (moduleId) {
      navigate(`/module/${moduleId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen bg-white p-8">
      <div className="cleo-lesson-container" style={{ maxWidth: '800px' }}>
        <div className="flex justify-start mb-4">
          <button onClick={handleBackToModule} className="cleo-back-btn">
            <ArrowLeft className="h-4 w-4" />
            Back to Module
          </button>
        </div>

        <div className="cleo-logo">Cleo</div>

        <div className="flex justify-between items-center mb-8">
          <div className="cleo-avatar mx-0">🧑🏻‍🔬</div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="cleo-back-btn">
                  <span className="text-lg">🔈</span>
                  <span className="truncate max-w-[120px]">
                    {selectedSpeaker?.label || 'Select speaker'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="mb-2 font-semibold text-sm" style={{ color: 'hsl(var(--cleo-text-main))' }}>
                  Select Speaker
                </div>
                <AudioDeviceSelector
                  devices={audioOutputs}
                  selectedDeviceId={selectedSpeaker?.deviceId}
                  onSelect={setSpeaker}
                  type="output"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="cleo-back-btn">
                  <span className="text-lg">🎙️</span>
                  <span className="truncate max-w-[120px]">
                    {selectedMicrophone?.label || 'Select microphone'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="mb-2 font-semibold text-sm" style={{ color: 'hsl(var(--cleo-text-main))' }}>
                  Select Microphone
                </div>
                <AudioDeviceSelector
                  devices={audioInputs}
                  selectedDeviceId={selectedMicrophone?.deviceId}
                  onSelect={setMicrophone}
                  type="input"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <h1 className="cleo-heading">
          Here's your lesson plan, {lessonPlan.year_group} 🦊
        </h1>

        {/* Subscription prompt for users with 0 minutes */}
        <div className="mb-6">
          <VoiceSessionIndicator showSubscriptionPrompt={true} />
        </div>

        <div className="cleo-planning-card" style={{ maxWidth: '100%' }}>
          <h2 className="text-2xl font-semibold text-center mb-3" style={{ color: 'hsl(var(--cleo-text-main))' }}>
            {lessonPlan.topic}
          </h2>
          <h3 className="text-lg text-center mb-4" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
            Learning Objectives
          </h3>
          
          <ul className="mb-6 space-y-2 text-[15px] text-left" style={{ color: 'hsl(var(--cleo-text-main))', lineHeight: '1.5' }}>
            {lessonPlan.learning_objectives.map((objective, index) => (
              <li key={index}>• {objective}</li>
            ))}
          </ul>

          {/* Estimated Duration */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-full bg-mint-50 border border-mint-200 mb-4">
            <Clock className="h-4 w-4 text-mint-700" />
            <span className="text-sm font-medium text-mint-700">
              Estimated Duration: {estimatedMinutes} minutes
            </span>
          </div>

          <div className="flex gap-3 flex-wrap mt-6 mb-6">
            {lessonPlan.teaching_sequence.map((step, index) => (
              <div key={step.id} className="cleo-step-pill">
                <div className="cleo-step-number">{index + 1}</div>
                <div>{step.title}</div>
              </div>
            ))}
          </div>

          <button 
            onClick={onStartLesson} 
            disabled={!hasQuota || checkingQuota}
            className={`cleo-btn-primary w-full mt-5 ${(!hasQuota || checkingQuota) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">▶️</span>
            {checkingQuota ? 'Checking availability...' : 'Start Lesson with Cleo'}
          </button>
          {!hasQuota && !checkingQuota && (
            <p className="text-sm text-center text-red-600 mt-2 font-medium">
              Subscribe to start your lesson
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
