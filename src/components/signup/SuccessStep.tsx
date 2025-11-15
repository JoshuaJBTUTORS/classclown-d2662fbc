import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Sparkles, 
  GraduationCap,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';
import { supabase } from '@/integrations/supabase/client';

interface SuccessStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ data, onPrev }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const loadingSteps = [
    "Creating your Cleo account...",
    "Setting up your profile...",
    "Configuring your subjects...",
    "Personalizing your experience...",
    "Almost ready!"
  ];

  useEffect(() => {
    createAccount();
  }, []);

  const createAccount = async () => {
    try {
      // Progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      // Step animation
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % loadingSteps.length);
      }, 1000);

      // Create account
      await signUp(
        data.parentEmail,
        data.password,
        {
          first_name: data.parentFirstName,
          last_name: data.parentLastName,
          role: 'learning_hub_only'
        }
      );

      // Get the current user after signup
      const { data: { user } } = await supabase.auth.getUser();

      // Update profile with onboarding data
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            region: data.region || 'england',
            curriculum: data.curriculum || 'english',
            education_level: data.educationLevel,
            year_group_id: data.yearGroupId,
            gcse_subject_ids: data.selectedSubjects || [],
            exam_boards: data.educationLevel === 'gcse' ? (data.examBoards || {}) : null,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            phone_number: data.parentPhone
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      // Wait for animation to complete
      setTimeout(() => {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
        setIsComplete(true);
        setShowConfetti(true);
        toast.success('Cleo account created successfully!');
      }, 5000);
      
    } catch (error: any) {
      toast.error('Failed to create account. Please try again.');
      console.error('Account creation error:', error);
      setLoadingProgress(0);
      setCurrentStep(0);
    }
  };

  const ConfettiParticle = ({ delay }: { delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: -100, x: Math.random() * 200 - 100 }}
      animate={{ 
        opacity: [0, 1, 0], 
        y: [0, 200], 
        rotate: [0, 360 * 2],
        scale: [0.5, 1, 0.5]
      }}
      transition={{ 
        duration: 2.5, 
        delay,
        ease: "easeOut"
      }}
      className={`absolute w-2 h-2 sm:w-3 sm:h-3 ${
        Math.random() > 0.5 ? 'bg-primary' : 
        Math.random() > 0.5 ? 'bg-accent' : 'bg-secondary'
      } rounded-full`}
      style={{
        left: `${Math.random() * 100}%`,
        top: '10%'
      }}
    />
  );

  if (!isComplete) {
    return (
      <div className="space-y-8 relative">
        {/* Cleo Avatar */}
        <div className="absolute top-0 right-4 text-5xl">
          🧑🏻‍🔬
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              {/* Rotating Icon */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <div className="bg-primary/10 p-6 rounded-full">
                  <BookOpen className="h-16 w-16 text-primary" />
                </div>
              </motion.div>

              {/* Heading */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  Creating Your Cleo Account
                </h2>
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg text-muted-foreground"
                >
                  {loadingSteps[currentStep]}
                </motion.p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <Progress 
                  value={loadingProgress} 
                  className="w-full max-w-md mx-auto h-3"
                />
                <p className="text-sm font-medium text-primary">
                  {Math.round(loadingProgress)}% Complete
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground"
        >
          This will only take a moment...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-center relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.1} />
          ))}
        </div>
      )}

      {/* Cleo Avatar */}
      <motion.div 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-6xl"
      >
        🧑🏻‍🔬
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
          <CardContent className="p-8 space-y-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="relative inline-block">
                <div className="bg-green-100 dark:bg-green-950 p-6 rounded-full">
                  <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400" />
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-8 w-8 text-accent" />
                </motion.div>
              </div>
            </motion.div>

            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-bold text-foreground">
                Welcome to Cleo! 🎉
              </h2>
              <p className="text-xl text-muted-foreground">
                Your account is ready, {data.parentFirstName}!
              </p>
              
              {/* Free Lessons Badge */}
              <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 inline-block">
                <p className="text-base text-green-800 dark:text-green-200 font-semibold">
                  🎉 3 FREE voice lessons included!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  No credit card required • Start learning immediately
                </p>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <Button
                onClick={() => navigate('/learning-hub')}
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg font-semibold group"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Start Learning with Cleo
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Explore courses, chat with Cleo, and achieve your goals!
              </p>
            </motion.div>

            {/* Inspirational Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="border-t border-border pt-6"
            >
              <blockquote className="text-base text-muted-foreground italic">
                "Education is the most powerful weapon which you can use to change the world."
              </blockquote>
              <p className="text-sm text-muted-foreground/70 mt-2">— Nelson Mandela</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-sm text-muted-foreground"
      >
        Need help? Contact us at{' '}
        <a href="mailto:hello@heycleo.io" className="text-primary hover:underline">
          hello@heycleo.io
        </a>
      </motion.p>
    </div>
  );
};

export default SuccessStep;
