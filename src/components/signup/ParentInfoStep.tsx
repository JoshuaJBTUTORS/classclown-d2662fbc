
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, User, Mail, Phone, Info } from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';

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
    phone: false,
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

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
        break;
      case 'parentPhone':
        isValid = validatePhone(value);
        setValidationState(prev => ({ ...prev, phone: isValid }));
        break;
    }
  };

  const canProceed = 
    data.parentFirstName.trim() &&
    data.parentLastName.trim() &&
    validateEmail(data.parentEmail) &&
    validatePhone(data.parentPhone);

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
                <Input
                  type="email"
                  placeholder="Enter your email here..."
                  value={data.parentEmail}
                  onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                  className="h-14 text-base"
                />
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
