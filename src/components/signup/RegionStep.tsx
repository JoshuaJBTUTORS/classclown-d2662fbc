import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignupData } from '@/pages/InteractiveSignup';

interface RegionStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

type Region = 'england' | 'scotland' | 'wales';

const regions = [
  {
    value: 'england' as Region,
    label: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    curriculum: 'english' as const,
    description: 'National Curriculum for England'
  },
  {
    value: 'scotland' as Region,
    label: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    curriculum: 'scottish' as const,
    description: 'Scottish Curriculum for Excellence'
  },
  {
    value: 'wales' as Region,
    label: 'Wales',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    curriculum: 'welsh' as const,
    description: 'Welsh Curriculum'
  }
];

const RegionStep: React.FC<RegionStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const handleRegionSelect = (region: Region, curriculum: 'english' | 'scottish' | 'welsh') => {
    updateData({ region, curriculum });
  };

  const canProceed = !!data.region;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Where are you studying? 🌍
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          This helps Cleo personalize your learning content to match your curriculum
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {regions.map((region, index) => (
          <motion.div
            key={region.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                data.region === region.value
                  ? 'border-2 border-primary bg-primary/5 shadow-md'
                  : 'border-2 border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => handleRegionSelect(region.value, region.curriculum)}
            >
              <div className="text-center space-y-3">
                <div className="text-5xl mb-2">{region.flag}</div>
                <h3 className="text-xl font-bold text-gray-900">{region.label}</h3>
                <p className="text-sm text-gray-600">{region.description}</p>
                {data.region === region.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-primary font-semibold"
                  >
                    ✓ Selected
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row justify-between gap-4 pt-6"
      >
        <Button
          variant="outline"
          onClick={onPrev}
          className="h-12 sm:w-auto order-2 sm:order-1"
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
        <p className="text-sm text-gray-500 text-center">
          Please select your region to continue
        </p>
      )}
    </div>
  );
};

export default RegionStep;
