
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, User, Mail, Phone, Info, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';
import { checkParentEmailUniqueness } from '@/services/uniquenessValidationService';
import { Link } from 'react-router-dom';

interface ParentInfoStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ParentInfoStep: React.FC<ParentInfoStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [validationState, setValidationState] = useState({
    firstName: false,
    lastName: false,
    email: false,
  });
  
  const [emailCheckState, setEmailCheckState] = useState<{
    isChecking: boolean;
    emailExists: boolean;
    errorMessage: string | null;
  }>({
    isChecking: false,
    emailExists: false,
    errorMessage: null,
  });

  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const checkEmailAvailability = async (email: string) => {
    if (!validateEmail(email)) {
      return;
    }

    setEmailCheckState({
      isChecking: true,
      emailExists: false,
      errorMessage: null,
    });

    try {
      const result = await checkParentEmailUniqueness(email);
      
      if (!result.isUnique) {
        setEmailCheckState({
          isChecking: false,
          emailExists: true,
          errorMessage: 'This email is already registered. Please sign in instead or use a different email.',
        });
      } else {
        setEmailCheckState({
          isChecking: false,
          emailExists: false,
          errorMessage: null,
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Don't block signup on check failure, just log it
      setEmailCheckState({
        isChecking: false,
        emailExists: false,
        errorMessage: null,
      });
    }
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [emailCheckTimeout]);

  const handleInputChange = (field: keyof SignupData, value: string) => {
    updateData({ [field]: value });
    
    // Update validation state
    let isValid = false;
    switch (field) {
      case 'parentFirstName':
        isValid = value.trim().length >= 2;
        setValidationState(prev => ({ ...prev, firstName: isValid }));
        break;
      case 'parentLastName':
        isValid = value.trim().length >= 2;
        setValidationState(prev => ({ ...prev, lastName: isValid }));
        break;
      case 'parentEmail':
        isValid = validateEmail(value);
        setValidationState(prev => ({ ...prev, email: isValid }));
        
        // Clear previous timeout
        if (emailCheckTimeout) {
          clearTimeout(emailCheckTimeout);
        }
        
        // Debounce email check
        if (isValid) {
          const timeout = setTimeout(() => {
            checkEmailAvailability(value);
          }, 800);
          setEmailCheckTimeout(timeout);
        } else {
          setEmailCheckState({
            isChecking: false,
            emailExists: false,
            errorMessage: null,
          });
        }
        break;
    }
  };

  const canProceed = 
    data.parentFirstName.trim() &&
    data.parentLastName.trim() &&
    validateEmail(data.parentEmail) &&
    !emailCheckState.isChecking &&
    !emailCheckState.emailExists;

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      {/* Cleo Logo */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-primary">Cleo</h1>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Left Column - Form */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-5xl font-bold text-foreground mb-4">
              Let's get your details 👋
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              We'll use this information to create your account and keep you updated.
            </p>

            <div className="space-y-6">
              {/* First Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="flex items-center text-base font-semibold text-foreground">
                  <User className="h-4 w-4 mr-2" />
                  First Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your first name here..."
                  value={data.parentFirstName}
                  onChange={(e) => handleInputChange('parentFirstName', e.target.value)}
                  className="h-14 text-base"
                />
              </motion.div>

              {/* Last Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="flex items-center text-base font-semibold text-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Last Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your last name here..."
                  value={data.parentLastName}
                  onChange={(e) => handleInputChange('parentLastName', e.target.value)}
                  className="h-14 text-base"
                />
              </motion.div>

              {/* Email Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="flex items-center text-base font-semibold text-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={data.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    className="h-14 text-base pr-10"
                  />
                  {validationState.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailCheckState.isChecking && (
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      )}
                      {!emailCheckState.isChecking && !emailCheckState.emailExists && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {!emailCheckState.isChecking && emailCheckState.emailExists && (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {emailCheckState.isChecking && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {!emailCheckState.isChecking && !emailCheckState.emailExists && validationState.email && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Email available!
                  </p>
                )}
                {emailCheckState.errorMessage && (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {emailCheckState.errorMessage}
                    </p>
                    <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      Go to Sign In →
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 pt-8"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              className="h-14 px-8 text-base font-medium border-2 rounded-full"
            >
              ← Back
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className="h-14 px-8 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              Continue to Password →
            </Button>
          </motion.div>

          {/* Validation Message */}
          {!canProceed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-sm"
            >
              Please fill in all fields correctly to continue
            </motion.p>
          )}
        </div>

        {/* Right Column - Benefits */}
        <div className="space-y-6">
          {/* Account Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Account Benefits</h3>
              <p className="text-base text-muted-foreground">
                Access personalised lessons and track your progress.
              </p>
            </div>
          </motion.div>

          {/* Your Privacy Matters */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
              👩🏾
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Your Privacy Matters</h3>
              <p className="text-base text-muted-foreground">
                Your data is always safe and secure with Cleo.
              </p>
            </div>
          </motion.div>

          {/* Fantastic Step */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-3xl">
              💡
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                You're taking a fantastic step for your education!
              </h3>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ParentInfoStep;
