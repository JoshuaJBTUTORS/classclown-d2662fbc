
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, User, Sparkles, Edit3 } from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';

interface StudentInfoStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StudentInfoStep: React.FC<StudentInfoStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [validationState, setValidationState] = useState({
    firstName: false,
    lastName: false,
  });

  const [isTyping, setIsTyping] = useState({
    firstName: false,
    lastName: false,
  });

  const handleInputChange = (field: keyof SignupData, value: string) => {
    updateData({ [field]: value });
    
    // Set typing state
    const fieldKey = field === 'studentFirstName' ? 'firstName' : 'lastName';
    setIsTyping(prev => ({ ...prev, [fieldKey]: true }));
    
    // Clear typing state after delay
    setTimeout(() => {
      setIsTyping(prev => ({ ...prev, [fieldKey]: false }));
    }, 1000);
    
    // Update validation state
    const isValid = value.trim().length >= 2;
    setValidationState(prev => ({ 
      ...prev, 
      [fieldKey]: isValid 
    }));
  };

  const getInitials = () => {
    const firstName = data.studentFirstName.trim();
    const lastName = data.studentLastName.trim();
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const getAvatarColor = () => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    const name = data.studentFirstName + data.studentLastName;
    return colors[name.length % colors.length];
  };

  const canProceed = 
    data.studentFirstName.trim().length >= 2 &&
    data.studentLastName.trim().length >= 2;

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Now about your student! 🎓
            </h2>
            <p className="text-gray-600 mb-6">
              Let's personalize the learning experience for your child.
            </p>

            <div className="space-y-6">
              {/* Student First Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Student First Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter student's first name..."
                    value={data.studentFirstName}
                    onChange={(e) => handleInputChange('studentFirstName', e.target.value)}
                    className={`pr-12 transition-all duration-200 ${
                      validationState.firstName ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {isTyping.firstName && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Edit3 className="h-4 w-4 text-purple-500" />
                      </motion.div>
                    )}
                    {validationState.firstName && !isTyping.firstName && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                </div>
                {data.studentFirstName && validationState.firstName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-green-600 mt-1 flex items-center"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Beautiful name! ✓
                  </motion.p>
                )}
              </motion.div>

              {/* Student Last Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Student Last Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter student's last name..."
                    value={data.studentLastName}
                    onChange={(e) => handleInputChange('studentLastName', e.target.value)}
                    className={`pr-12 transition-all duration-200 ${
                      validationState.lastName ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {isTyping.lastName && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Edit3 className="h-4 w-4 text-purple-500" />
                      </motion.div>
                    )}
                    {validationState.lastName && !isTyping.lastName && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-between pt-6"
          >
            <Button
              variant="outline"
              onClick={onPrev}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!canProceed}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Account →
            </Button>
          </motion.div>
          
          {!canProceed && (
            <p className="text-sm text-gray-500 text-center">
              Please enter both first and last name
            </p>
          )}
        </div>

        {/* Avatar Preview Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <h4 className="font-medium text-gray-900 mb-4">
                Student Profile Preview
              </h4>
              
              <motion.div
                key={getInitials()}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <Avatar className={`h-20 w-20 mx-auto ${getAvatarColor()} ring-4 ring-white shadow-lg`}>
                  <AvatarFallback className="text-white text-xl font-bold">
                    {getInitials() || '??'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <motion.div
                key={data.studentFirstName + data.studentLastName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h5 className="font-semibold text-lg text-gray-900 mb-1">
                  {data.studentFirstName || 'First'} {data.studentLastName || 'Last'}
                </h5>
                <p className="text-sm text-gray-600 mb-2">
                  {data.yearGroup || 'Year Group'} Student
                </p>
                <p className="text-xs text-purple-600">
                  {data.subjects.length > 0 
                    ? `Studying ${data.subjects.length} subject${data.subjects.length > 1 ? 's' : ''}`
                    : 'Ready to learn!'
                  }
                </p>
              </motion.div>
            </CardContent>
          </Card>

          {/* Fun Facts */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-yellow-900 mb-1">
                  Did you know?
                </h4>
                <p className="text-sm text-yellow-700">
                  Students with personalized learning plans improve their grades by an average of 30%!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Encouragement */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-sm font-medium text-green-800 mb-1">
                "Almost ready to start the learning journey!"
              </p>
              <p className="text-xs text-green-600">
                One more step to unlock amazing educational content.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentInfoStep;
