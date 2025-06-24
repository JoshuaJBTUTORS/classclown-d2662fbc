
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
  Download,
  Play,
  ArrowRight
} from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';

interface AccountCreationStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
}

const AccountCreationStep: React.FC<AccountCreationStepProps> = ({
  data,
  onPrev
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const loadingSteps = [
    "Creating your account...",
    "Setting up student profile...",
    "Preparing learning materials...",
    "Personalizing experience...",
    "Almost ready!"
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let stepInterval: NodeJS.Timeout;

    if (!isComplete) {
      // Progress animation
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            setIsComplete(true);
            setShowConfetti(true);
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      // Step animation
      stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % loadingSteps.length);
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [isComplete]);

  const handleCreateAccount = async () => {
    try {
      const password = `${data.studentFirstName.toLowerCase()}${Math.floor(Math.random() * 1000)}!`;
      
      await signUp(data.parentEmail, password, {
        first_name: data.parentFirstName,
        last_name: data.parentLastName,
        role: 'parent'
      });

      toast.success('Account created successfully! Check your email for confirmation.');
      
      // Wait a moment then redirect
      setTimeout(() => {
        navigate('/learning-hub');
      }, 2000);
      
    } catch (error: any) {
      toast.error('Failed to create account. Please try again.');
      console.error('Account creation error:', error);
    }
  };

  const ConfettiParticle = ({ delay }: { delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: -100, x: Math.random() * 400 - 200 }}
      animate={{ 
        opacity: [0, 1, 0], 
        y: [0, 300], 
        rotate: [0, 360 * 3],
        scale: [0.5, 1, 0.5]
      }}
      transition={{ 
        duration: 3, 
        delay,
        ease: "easeOut"
      }}
      className={`absolute w-3 h-3 ${
        Math.random() > 0.5 ? 'bg-purple-500' : 
        Math.random() > 0.5 ? 'bg-yellow-400' : 'bg-pink-500'
      } rounded-full`}
      style={{
        left: `${Math.random() * 100}%`,
        top: '20%'
      }}
    />
  );

  if (!isComplete) {
    return (
      <div className="space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <BookOpen className="h-16 w-16 text-purple-600" />
            </motion.div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Creating Your Account
            </h2>
            <Progress value={loadingProgress} className="w-full max-w-md mx-auto h-3 mb-4" />
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-600"
            >
              {loadingSteps[currentStep]}
            </motion.p>
          </div>

          <div className="text-sm text-gray-500">
            <p>{Math.round(loadingProgress)}% Complete</p>
          </div>
        </motion.div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onPrev}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
        </div>
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

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto"
        >
          <div className="relative">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.5, duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your account is ready! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Welcome to JB Tutors, {data.parentFirstName}!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Account created for {data.studentFirstName} {data.studentLastName}
            </p>
            <p className="text-sm text-green-600">
              {data.yearGroup} • {data.subjects.length} subject{data.subjects.length > 1 ? 's' : ''} selected
            </p>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto"
        >
          <Card className="bg-purple-50 border-purple-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Download className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-900 mb-2">Welcome Packet</h4>
              <p className="text-sm text-purple-700 mb-3">
                Download your starter guide with tips and resources
              </p>
              <Button variant="outline" size="sm" className="border-purple-300">
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Play className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-900 mb-2">Getting Started</h4>
              <p className="text-sm text-blue-700 mb-3">
                Watch a quick video tour of the learning platform
              </p>
              <Button variant="outline" size="sm" className="border-blue-300">
                Watch Video
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <Button
            onClick={handleCreateAccount}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            Go to Learning Hub
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <p className="text-sm text-gray-500">
            Start exploring courses, homework, and progress tracking!
          </p>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="border-t pt-6 mt-8"
        >
          <blockquote className="text-gray-600 italic">
            "The beautiful thing about learning is that no one can take it away from you."
          </blockquote>
          <p className="text-sm text-gray-500 mt-2">— B.B. King</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccountCreationStep;
