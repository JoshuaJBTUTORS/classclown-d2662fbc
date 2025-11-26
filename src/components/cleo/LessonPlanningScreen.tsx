import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, BookOpen, Table, HelpCircle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProgressBar from '@/components/learningHub/ProgressBar';

interface LessonPlanningScreenProps {
  topic: string;
  yearGroup: string;
  lessonId?: string;
  conversationId?: string;
  learningGoal?: string;
  difficultyTier?: 'foundation' | 'intermediate' | 'higher';
  onComplete: (planId: string) => void;
  onError: (error: string) => void;
}

interface PlanningStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
}

export const LessonPlanningScreen: React.FC<LessonPlanningScreenProps> = ({
  topic,
  yearGroup,
  lessonId,
  conversationId,
  learningGoal,
  difficultyTier = 'intermediate',
  onComplete,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Initializing...');
  
  const [steps, setSteps] = useState<PlanningStep[]>([
    { id: 'objectives', label: 'Creating learning objectives', icon: <Lightbulb className="w-5 h-5" />, completed: false },
    { id: 'structure', label: 'Structuring teaching sequence', icon: <BookOpen className="w-5 h-5" />, completed: false },
    { id: 'tables', label: 'Designing tables and diagrams', icon: <Table className="w-5 h-5" />, completed: false },
    { id: 'questions', label: 'Preparing practice questions', icon: <HelpCircle className="w-5 h-5" />, completed: false },
  ]);

  // Estimated timings based on actual performance
  const phases = [
    { time: 2, label: 'Analyzing topic and learning objectives...', progress: 5 },
    { time: 12, label: 'Creating lesson structure with AI...', progress: 25 },
    { time: 25, label: 'Generating visual diagrams...', progress: 65 },
    { time: 40, label: 'Finalizing lesson content...', progress: 90 },
  ];

  useEffect(() => {
    generateLessonPlan();
    
    // Start progress tracking
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      
      // Find current phase based on elapsed time
      const currentPhaseData = phases.find((phase, index) => {
        const nextPhase = phases[index + 1];
        return elapsed >= phase.time && (!nextPhase || elapsed < nextPhase.time);
      }) || phases[0];
      
      setCurrentPhase(currentPhaseData.label);
      
      // Smooth progress that approaches but doesn't exceed estimated progress
      const targetProgress = Math.min(
        (elapsed / 50) * 95, // Cap at 95% until actual completion (estimated 50s total)
        currentPhaseData.progress
      );
      setProgress(targetProgress);
    }, 500);
    
    return () => clearInterval(timer);
  }, []);

  const generateLessonPlan = async () => {
    try {
      // Check if user is signed in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Please sign in to generate lesson plans');
      }

      // Steps will be updated based on actual progress phases

      // Call the edge function using Supabase client
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: {
          lessonId,
          topic,
          yearGroup,
          learningGoal,
          conversationId,
          difficultyTier
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate lesson plan');
      }
      
      // Complete all steps and progress
      setProgress(100);
      setSteps(prev => prev.map(s => ({ ...s, completed: true })));
      setCurrentStep(steps.length);

      // Wait a moment before completing
      setTimeout(() => {
        onComplete(data.lessonPlanId);
      }, 500);

    } catch (error) {
      console.error('Error generating lesson plan:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate lesson plan');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white p-8">
      <div className="cleo-lesson-container">
        <div className="cleo-logo">Cleo</div>
        
        <div className="cleo-avatar">🧑🏻‍🔬</div>

        <h1 className="cleo-heading">Preparing Your Lesson</h1>
        
        <p className="text-base mb-8" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
          Cleo is creating a personalized learning experience...
        </p>

        <div className="cleo-planning-card">
          {/* Progress Bar */}
          <div className="w-full mb-6">
            <ProgressBar 
              progress={progress} 
              size="lg"
              className="mb-3"
            />
            <div className="text-center">
              <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--cleo-text-main))' }}>
                {currentPhase}
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
                {elapsedTime}s elapsed • {Math.round(progress)}% complete
              </p>
            </div>
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Loader2 className="w-12 h-12" style={{ color: 'hsl(var(--cleo-green))' }} />
          </motion.div>

          <div className="cleo-planning-steps">
            {steps.map((step, index) => {
              const stepProgress = (index / steps.length) * 100;
              const isCompleted = progress > stepProgress + 15;
              const isActive = progress >= stepProgress && progress < stepProgress + 25 && !isCompleted;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`cleo-planning-step ${
                    isCompleted ? 'completed' : isActive ? 'active' : ''
                  }`}
                >
                  <div className="flex-shrink-0" style={{ 
                    color: isCompleted ? 'hsl(var(--cleo-green))' : 'hsl(var(--cleo-text-muted))' 
                  }}>
                    {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className={`flex-1 text-sm ${isCompleted ? 'font-medium' : ''}`} 
                    style={{ color: 'hsl(var(--cleo-text-main))' }}>
                    {step.label}
                  </span>
                  {isActive && (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--cleo-green))' }} />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f8f9f9' }}>
            <p className="text-xs text-center" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
              <span className="font-semibold" style={{ color: 'hsl(var(--cleo-text-main))' }}>{topic}</span>
              <br />
              {yearGroup}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};