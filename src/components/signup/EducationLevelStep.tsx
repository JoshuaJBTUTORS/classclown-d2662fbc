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
  const handleContinue = () => {
    updateData({ 
      educationLevel: 'gcse',
      yearGroupId: '041d7c7c-3b83-417c-a616-e26fe264cf50', // GCSE year group ID
      region: 'england',
      curriculum: 'english',
    });
    setTimeout(() => onNext(), 300);
  };

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="max-w-2xl mx-auto border-2 border-primary/50 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-primary/10 p-6 rounded-full">
                <BookOpen className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-3">GCSE Study Programme</h3>
                <p className="text-lg text-muted-foreground mb-2">Comprehensive GCSE preparation</p>
                <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full inline-block">
                  Ages 14-16 • Years 10-11
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 w-full">
                <p className="text-muted-foreground mb-4">
                  Access comprehensive courses in:
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Biology, Chemistry, Physics, Maths, English, Computer Science, and more...
                </p>
              </div>
              <Button onClick={handleContinue} size="lg" className="w-full mt-4">
                Continue with GCSE
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
