
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
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center lg:text-left">
              Let's get your details 👋
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center lg:text-left">
              We'll use this information to create your account and keep you updated on your child's progress.
            </p>

            <div className="space-y-4 sm:space-y-6">
              {/* First Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  First Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your first name here..."
                    value={data.parentFirstName}
                    onChange={(e) => handleInputChange('parentFirstName', e.target.value)}
                    className={`h-12 pr-10 transition-all duration-200 ${
                      validationState.firstName ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  {validationState.firstName && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
                {data.parentFirstName && validationState.firstName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs sm:text-sm text-green-600 mt-1"
                  >
                    Great! Name looks good. ✓
                  </motion.p>
                )}
              </motion.div>

              {/* Last Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Last Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your last name here..."
                    value={data.parentLastName}
                    onChange={(e) => handleInputChange('parentLastName', e.target.value)}
                    className={`h-12 pr-10 transition-all duration-200 ${
                      validationState.lastName ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  {validationState.lastName && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={data.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    className={`h-12 pr-10 transition-all duration-200 ${
                      validationState.email ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  {validationState.email && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
                {data.parentEmail && validationState.email && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs sm:text-sm text-green-600 mt-1"
                  >
                    Perfect! Email looks good. ✓
                  </motion.p>
                )}
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+44 7123 456789"
                    value={data.parentPhone}
                    onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    className={`h-12 pr-10 transition-all duration-200 ${
                      validationState.phone ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  {validationState.phone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
              className="bg-purple-600 hover:bg-purple-700 h-12 text-base font-semibold order-1 sm:order-2"
            >
              Continue to Student Details →
            </Button>
          </motion.div>
          
          {!canProceed && (
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Please fill in all fields correctly to continue
            </p>
          )}
        </div>

        {/* Sidebar Tips */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">
                    We'll use this info to:
                  </h4>
                  <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                    <li>• Send progress updates</li>
                    <li>• Schedule lessons</li>
                    <li>• Share homework feedback</li>
                    <li>• Provide support when needed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-2">🔒</div>
              <h4 className="font-medium text-green-900 mb-1 text-sm">
                Your Privacy Matters
              </h4>
              <p className="text-xs sm:text-sm text-green-700">
                We never share your personal information with third parties. 
                Your data is secure with us.
              </p>
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-2">🌟</div>
              <p className="text-xs sm:text-sm font-medium text-purple-800">
                "You're making a great investment in your child's future!"
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ParentInfoStep;
