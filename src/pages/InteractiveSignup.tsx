
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import WelcomePage from '@/components/signup/WelcomePage';
import YearGroupSubjectStep from '@/components/signup/YearGroupSubjectStep';
import ParentInfoStep from '@/components/signup/ParentInfoStep';
import StudentInfoStep from '@/components/signup/StudentInfoStep';
import AccountCreationStep from '@/components/signup/AccountCreationStep';

export interface SignupData {
  yearGroup: string;
  subjects: string[];
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  studentFirstName: string;
  studentLastName: string;
}

const InteractiveSignup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [signupData, setSignupData] = useState<SignupData>({
    yearGroup: '',
    subjects: [],
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    studentFirstName: '',
    studentLastName: '',
  });

  const steps = [
    { title: "Student Info", component: YearGroupSubjectStep },
    { title: "Parent Info", component: ParentInfoStep },
    { title: "Student Details", component: StudentInfoStep },
    { title: "Complete", component: AccountCreationStep },
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
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join JB Tutors
            </h1>
            <p className="text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
          
          <div className="relative">
            <Progress value={progressPercentage} className="h-3 mb-4" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {Math.round(progressPercentage)}% Complete
              </span>
              <span className="text-sm text-purple-600 font-medium">
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
              <CardContent className="p-8">
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

        {/* Navigation */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between items-center max-w-4xl mx-auto mt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-500">
              Need help? Contact us at hello@jbtutors.co.uk
            </div>
            
            <Button
              onClick={nextStep}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveSignup;
