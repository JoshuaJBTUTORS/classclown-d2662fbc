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
    // Edge function handles checking for existing plans, so just generate directly
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

      // Handle different response types
      if (data.isExisting) {
        // Existing plan found - skip animation and go directly
        console.log('📚 Using existing universal lesson plan:', data.lessonPlanId);
        setSteps(prev => prev.map(s => ({ ...s, completed: true })));
        setCurrentStep(steps.length);
        onComplete(data.lessonPlanId);
      } else if (data.isGenerating) {
        // Another instance is generating - wait a moment
        console.log('⏳ Another request is generating this plan, loading...');
        setSteps(prev => prev.map(s => ({ ...s, completed: true })));
        setCurrentStep(steps.length);
        setTimeout(() => {
          onComplete(data.lessonPlanId);
        }, 1500);
      } else {
        // New plan generated - show full animation
        console.log('✨ New lesson plan generated:', data.lessonPlanId);
        setSteps(prev => prev.map(s => ({ ...s, completed: true })));
        setCurrentStep(steps.length);
        setTimeout(() => {
          onComplete(data.lessonPlanId);
        }, 500);
      }

    } catch (error) {
      console.error('Error generating lesson plan:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate lesson plan');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Preparing Your Lesson
          </h2>
          <p className="text-muted-foreground">
            Cleo is creating a personalized learning experience...
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.completed 
                  ? 'bg-primary/10 border border-primary/20' 
                  : currentStep === index
                  ? 'bg-muted border border-border'
                  : 'bg-muted/50'
              }`}
            >
              <div className={`flex-shrink-0 ${
                step.completed ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={`flex-1 text-sm ${
                step.completed ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {currentStep === index && !step.completed && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-semibold text-foreground">{topic}</span>
            <br />
            {yearGroup}
          </p>
        </div>
      </motion.div>
    </div>
  );
};