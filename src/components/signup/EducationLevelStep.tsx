import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignupData } from '@/pages/InteractiveSignup';
import { GraduationCap, BookOpen } from 'lucide-react';

interface EducationLevelStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const EducationLevelStep: React.FC<EducationLevelStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev,
  isFirst,
}) => {
  const handleSelect = (level: 'gcse' | '11plus', yearGroupId: string) => {
    updateData({ 
      educationLevel: level,
      yearGroupId,
      region: 'england',
      curriculum: 'english',
    });
    setTimeout(() => onNext(), 300);
  };

  const educationLevels = [
    {
      id: 'gcse',
      yearGroupId: '041d7c7c-3b83-417c-a616-e26fe264cf50', // GCSE year group ID
      icon: BookOpen,
      title: 'GCSE',
      description: "I'm preparing for my GCSE exams",
      ageRange: 'Ages 14-16 • Years 10-11',
      preview: 'Biology, Chemistry, Physics, Maths, English...',
      gradient: 'from-blue-500 to-purple-500',
    },
    {
      id: '11plus',
      yearGroupId: 'e434ace2-5fdf-4224-9f33-6211727570a8', // 11 Plus year group ID
      icon: GraduationCap,
      title: '11 Plus',
      description: "I'm preparing for 11+ entrance exams",
      ageRange: 'Ages 10-11 • Year 6',
      preview: 'English, Maths, Verbal Reasoning, Non-Verbal Reasoning',
      gradient: 'from-green-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-2 sm:space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900"
        >
          What are you studying for? 🎯
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base lg:text-lg text-gray-600"
        >
          Let's personalize your learning journey with Cleo
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {educationLevels.map((level, index) => {
          const Icon = level.icon;
          const isSelected = data.educationLevel === level.id;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  isSelected
                    ? 'ring-2 ring-purple-500 shadow-lg scale-105'
                    : 'hover:scale-102'
                }`}
                onClick={() => handleSelect(level.id as 'gcse' | '11plus', level.yearGroupId)}
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4">
                    {/* Icon with gradient background */}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${level.gradient} flex items-center justify-center mx-auto`}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>

                    {/* Title */}
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {level.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-1">
                        {level.description}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        {level.ageRange}
                      </p>
                    </div>

                    {/* Preview subjects */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
                        {level.preview}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 sm:pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="px-6 sm:px-8"
        >
          ← Back
        </Button>

        <div className="text-xs sm:text-sm text-gray-500">
          Select your education level to continue
        </div>
      </div>
    </div>
  );
};

export default EducationLevelStep;
