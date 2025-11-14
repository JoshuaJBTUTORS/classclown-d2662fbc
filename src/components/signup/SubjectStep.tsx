import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignupData } from '@/pages/InteractiveSignup';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check } from 'lucide-react';

interface SubjectStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface Subject {
  id: string;
  name: string;
}

const subjectEmojis: Record<string, string> = {
  // GCSE subjects
  'GCSE Biology': '🧬',
  'GCSE Chemistry': '⚗️',
  'GCSE Physics': '⚛️',
  'GCSE Mathematics': '🔢',
  'GCSE Maths': '🔢',
  'GCSE English Language': '📖',
  'GCSE English Literature': '📚',
  'GCSE History': '📜',
  'GCSE Geography': '🌍',
  'GCSE Computer Science': '💻',
  'GCSE Spanish': '🇪🇸',
  'GCSE French': '🇫🇷',
  'GCSE German': '🇩🇪',
  'GCSE Art': '🎨',
  'GCSE Drama': '🎭',
  'GCSE Music': '🎵',
  'GCSE PE': '⚽',
  'GCSE Business': '💼',
  'GCSE Religious Studies': '✝️',
  // 11+ subjects
  '11 Plus English': '📚',
  '11 Plus Maths': '🔢',
  '11 Plus VR': '🧠',
  '11 Plus NVR': '🔍',
};

const EXCLUDED_GCSE_SUBJECTS = [
  'GCSE Business',
  'GCSE Combined Science',
  'GCSE Economics',
  'GCSE Geography',
];

const SubjectStep: React.FC<SubjectStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, [data.educationLevel]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      // Determine category based on education level
      const category = data.educationLevel === 'gcse' ? 'gcse' : 'entrance';
      
      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('category', category)
        .order('name');

      if (error) throw error;
      
      // Filter out excluded subjects for GCSE
      const filteredSubjects = data.educationLevel === 'gcse' 
        ? (subjectsData || []).filter(s => !EXCLUDED_GCSE_SUBJECTS.includes(s.name))
        : (subjectsData || []);
      
      setSubjects(filteredSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    const currentSubjects = data.selectedSubjects || [];
    const isSelected = currentSubjects.includes(subjectId);
    
    const newSubjects = isSelected
      ? currentSubjects.filter(id => id !== subjectId)
      : [...currentSubjects, subjectId];
    
    updateData({ selectedSubjects: newSubjects });
  };

  const handleSelectAll = () => {
    const allSubjectIds = subjects.map(s => s.id);
    const currentSubjects = data.selectedSubjects || [];
    
    if (currentSubjects.length === subjects.length) {
      updateData({ selectedSubjects: [] });
    } else {
      updateData({ selectedSubjects: allSubjectIds });
    }
  };

  const isSelected = (subjectId: string) => {
    return (data.selectedSubjects || []).includes(subjectId);
  };

  const canProceed = (data.selectedSubjects?.length || 0) > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-foreground"
        >
          {data.educationLevel === 'gcse' 
            ? 'What subjects do you want to study?' 
            : 'What areas do you want to focus on?'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Select all the subjects Cleo should help you with
        </motion.p>
        <Button
          variant="outline"
          onClick={handleSelectAll}
          className="border-primary/50 hover:bg-primary/10 hover:border-primary"
        >
          {(data.selectedSubjects?.length || 0) === subjects.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-300 relative ${
                  isSelected(subject.id)
                    ? 'border-2 border-primary bg-primary/5 shadow-md'
                    : 'border-2 border-transparent hover:border-primary/30'
                }`}
                onClick={() => handleSubjectToggle(subject.id)}
              >
                <div className="text-center space-y-2">
                  <div className="text-5xl">{subjectEmojis[subject.name] || '📚'}</div>
                  <h4 className="font-semibold text-sm text-foreground">{subject.name}</h4>
                  {isSelected(subject.id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {!canProceed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center font-medium"
        >
          Please select at least one subject
        </motion.p>
      )}

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
    </div>
  );
};

export default SubjectStep;
