import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, BookOpen, Table, HelpCircle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LessonPlanningScreenProps {
  topic: string;
  yearGroup: string;
  lessonId?: string;
  conversationId?: string;
  learningGoal?: string;
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
  onComplete,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<PlanningStep[]>([
    { id: 'objectives', label: 'Creating learning objectives', icon: <Lightbulb className="w-5 h-5" />, completed: false },
    { id: 'structure', label: 'Structuring teaching sequence', icon: <BookOpen className="w-5 h-5" />, completed: false },
    { id: 'tables', label: 'Designing tables and diagrams', icon: <Table className="w-5 h-5" />, completed: false },
    { id: 'questions', label: 'Preparing practice questions', icon: <HelpCircle className="w-5 h-5" />, completed: false },
  ]);

  useEffect(() => {
    generateLessonPlan();
  }, []);

  const generateLessonPlan = async () => {
    try {
      // Check if user is signed in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Please sign in to generate lesson plans');
      }

      // Simulate progress through steps
      const stepInterval = setInterval(() => {
        setSteps(prev => {
          const nextIncomplete = prev.findIndex(s => !s.completed);
          if (nextIncomplete === -1) return prev;
          
          const updated = [...prev];
          updated[nextIncomplete].completed = true;
          setCurrentStep(nextIncomplete + 1);
          return updated;
        });
      }, 2000);

      // Call the edge function using Supabase client
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: {
          lessonId,
          topic,
          yearGroup,
          learningGoal,
          conversationId
        }
      });

      clearInterval(stepInterval);

      if (error) {
        throw new Error(error.message || 'Failed to generate lesson plan');
      }
      
      // Complete all steps
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cleo-card max-w-[480px] w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Loader2 className="w-12 h-12" style={{ color: 'hsl(var(--cleo-green))' }} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--cleo-text-main))' }}>
            Preparing Your Lesson
          </h2>
          <p style={{ color: 'hsl(var(--cleo-text-muted))' }}>
            Cleo is creating a personalized learning experience...
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.completed 
                  ? 'bg-[#cdefd7] border border-[#a0dbb5]' 
                  : currentStep === index
                  ? 'bg-[#f2f4f4] border border-[#e5ebe7]'
                  : 'bg-[#f8f9f9]'
              }`}
            >
              <div className={`flex-shrink-0 ${
                step.completed ? 'text-[hsl(var(--cleo-green))]' : 'text-[hsl(var(--cleo-text-muted))]'
              }`}>
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={`flex-1 text-sm ${
                step.completed ? 'font-medium' : ''
              }`} style={{ color: 'hsl(var(--cleo-text-main))' }}>
                {step.label}
              </span>
              {currentStep === index && !step.completed && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--cleo-green))' }} />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f8f9f9' }}>
          <p className="text-xs text-center" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
            <span className="font-semibold" style={{ color: 'hsl(var(--cleo-text-main))' }}>{topic}</span>
            <br />
            {yearGroup}
          </p>
        </div>
      </motion.div>
    </div>
  );
};