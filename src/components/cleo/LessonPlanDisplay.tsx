import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Target, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { lessonDurationEstimator } from '@/services/lessonDurationEstimator';

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
        <button onClick={handleBackToModule} className="cleo-back-btn">
          <ArrowLeft className="h-4 w-4" />
          Back to Module
        </button>

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

          <button onClick={onStartLesson} className="cleo-btn-primary w-full mt-5">
            <span className="text-lg">▶️</span>
            Start Lesson with Cleo
          </button>
        </div>
      </div>
    </div>
  );
};
