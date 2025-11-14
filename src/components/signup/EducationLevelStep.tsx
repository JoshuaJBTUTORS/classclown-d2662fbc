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
    <div className="space-y-8 relative">
      {/* Cleo Avatar */}
      <div className="absolute top-0 right-4 text-5xl">
        🧑🏻‍🔬
      </div>
      
      <div className="text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-foreground"
        >
          What are you studying for?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Select your current education level
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {educationLevels.map((level, index) => {
          const Icon = level.icon;
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-primary hover:scale-[1.02] overflow-hidden group"
                onClick={() => handleSelect(level.id as 'gcse' | '11plus', level.yearGroupId)}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{level.title}</h3>
                      <p className="text-muted-foreground mb-2">{level.description}</p>
                      <p className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">
                        {level.ageRange}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 w-full">
                      <p className="text-sm text-muted-foreground">
                        {level.preview}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="px-8"
        >
          ← Back
        </Button>

        <div className="text-sm text-muted-foreground">
          Select your education level to continue
        </div>
      </div>
    </div>
  );
};

export default EducationLevelStep;
