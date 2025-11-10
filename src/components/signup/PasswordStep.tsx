import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SignupData } from '@/pages/InteractiveSignup';
import PasswordCreationForm from './PasswordCreationForm';

interface PasswordStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const PasswordStep: React.FC<PasswordStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const passwordRequirements = [
    data.password.length >= 8,
    /[A-Z]/.test(data.password),
    /[a-z]/.test(data.password),
    /\d/.test(data.password),
    /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
  ];
  
  const allRequirementsMet = passwordRequirements.every(req => req);
  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;
  const canProceed = allRequirementsMet && passwordsMatch;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Create Your Cleo Password 🔐
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Choose a secure password to protect your account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto"
        >
          <PasswordCreationForm
            password={data.password}
            confirmPassword={data.confirmPassword}
            onPasswordChange={(password) => updateData({ password })}
            onConfirmPasswordChange={(confirmPassword) => updateData({ confirmPassword })}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-between gap-4 pt-4 sm:pt-6"
        >
          <Button
            variant="outline"
            onClick={onPrev}
            className="flex items-center justify-center gap-2 h-12 sm:w-auto order-2 sm:order-1"
          >
            ← Back
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className="bg-primary hover:bg-primary/90 h-12 text-base font-semibold order-1 sm:order-2"
          >
            Continue →
          </Button>
        </motion.div>
        
        {!canProceed && (
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Please create a secure password and confirm it to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default PasswordStep;
