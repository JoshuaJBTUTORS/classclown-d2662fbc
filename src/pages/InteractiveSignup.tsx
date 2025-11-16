import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import WelcomePage from '@/components/signup/WelcomePage';
import ParentInfoStep from '@/components/signup/ParentInfoStep';
import StudentInfoStep from '@/components/signup/StudentInfoStep';
import PasswordStep from '@/components/signup/PasswordStep';
import SubjectStep from '@/components/signup/SubjectStep';
import ExamBoardStep from '@/components/signup/ExamBoardStep';
import SuccessStep from '@/components/signup/SuccessStep';

export interface SignupData {
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  studentFirstName: string;
  studentLastName: string;
  password: string;
  confirmPassword: string;
  // Simplified onboarding fields for GCSE
  educationLevel?: 'gcse';
  region?: 'england' | 'scotland' | 'wales';
  curriculum?: 'english' | 'scottish' | 'welsh';
  yearGroupId?: string;
  selectedSubjects?: string[];
  examBoards?: Record<string, string>;
}

const InteractiveSignup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [signupData, setSignupData] = useState<SignupData>({
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    studentFirstName: '',
    studentLastName: '',
    password: '',
    confirmPassword: '',
    educationLevel: 'gcse',
    region: 'england',
    curriculum: 'english',
    yearGroupId: '041d7c7c-3b83-417c-a616-e26fe264cf50', // GCSE year group ID
    selectedSubjects: [],
    examBoards: {},
  });

  // Build steps array dynamically
  const baseSteps = [
    { title: "Parent Info", component: ParentInfoStep },
    { title: "Student Details", component: StudentInfoStep },
    { title: "Password", component: PasswordStep },
    { title: "Subjects", component: SubjectStep },
  ];

  const examBoardStep = { title: "Exam Boards", component: ExamBoardStep };
  const successStep = { title: "Complete", component: SuccessStep };

  const steps = [
    ...baseSteps,
    examBoardStep,
    successStep,
  ];

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startSignup = () => {
    setShowWelcome(false);
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (showWelcome) {
    return <WelcomePage onStart={startSignup} />;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Create Your Cleo Account
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
          
          <div className="relative">
            <Progress value={progressPercentage} className="h-2 sm:h-3 mb-3 sm:mb-4" />
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-500">
                {Math.round(progressPercentage)}% Complete
              </span>
              <span className="text-xs sm:text-sm text-purple-600 font-medium">
                Almost there! 🎓
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <CurrentStepComponent
                  data={signupData}
                  updateData={updateSignupData}
                  onNext={nextStep}
                  onPrev={prevStep}
                  isFirst={currentStep === 0}
                  isLast={currentStep === steps.length - 1}
                />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Help Text */}
        <div className="text-center max-w-4xl mx-auto mt-6 sm:mt-8 space-y-3">
          <div className="text-xs sm:text-sm text-gray-500">
            Need help? Contact us at hello@jbtutors.co.uk
          </div>
          
          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSignup;
