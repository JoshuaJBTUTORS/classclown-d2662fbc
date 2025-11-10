import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignupData } from '@/pages/InteractiveSignup';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface YearGroupStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface YearGroup {
  id: string;
  display_name: string;
  age_range?: string;
  national_curriculum_level?: string;
}

const YearGroupStep: React.FC<YearGroupStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYearGroups();
  }, [data.curriculum]);

  const loadYearGroups = async () => {
    if (!data.curriculum) return;
    
    setLoading(true);
    try {
      const { data: groups, error } = await supabase
        .from('curriculum_year_groups')
        .select('*')
        .eq('curriculum', data.curriculum)
        .order('display_name');

      if (error) throw error;
      setYearGroups(groups || []);
    } catch (error) {
      console.error('Error loading year groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedYearGroups = yearGroups.reduce((acc, yg) => {
    const level = yg.national_curriculum_level || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(yg);
    return acc;
  }, {} as Record<string, YearGroup[]>);

  const handleYearGroupSelect = (yearGroupId: string) => {
    updateData({ yearGroupId });
  };

  const canProceed = !!data.yearGroupId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          What year are you in? 📚
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          This helps Cleo provide age-appropriate content and difficulty levels
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {Object.entries(groupedYearGroups).map(([level, groups]) => (
          <div key={level}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{level}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groups.map((yg) => (
                <motion.div
                  key={yg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all duration-300 text-center ${
                      data.yearGroupId === yg.id
                        ? 'border-2 border-primary bg-primary/5 shadow-md'
                        : 'border-2 border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => handleYearGroupSelect(yg.id)}
                  >
                    <h4 className="font-bold text-gray-900 mb-1">{yg.display_name}</h4>
                    {yg.age_range && (
                      <p className="text-xs text-gray-500">{yg.age_range}</p>
                    )}
                    {data.yearGroupId === yg.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary font-semibold mt-2 text-sm"
                      >
                        ✓ Selected
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
          Please select your year group to continue
        </p>
      )}
    </div>
  );
};

export default YearGroupStep;
