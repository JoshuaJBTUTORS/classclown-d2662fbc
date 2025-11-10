import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignupData } from '@/pages/InteractiveSignup';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ExamBoardStepProps {
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
};

const examBoards = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'Eduqas', 'Other'];

const ExamBoardStep: React.FC<ExamBoardStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // If 11+ student, skip this step automatically
  useEffect(() => {
    if (data.educationLevel === '11plus') {
      onNext();
      return;
    }
  }, [data.educationLevel, onNext]);

  useEffect(() => {
    loadSelectedSubjects();
  }, [data.selectedSubjects]);

  const loadSelectedSubjects = async () => {
    if (!data.selectedSubjects || data.selectedSubjects.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', data.selectedSubjects);

      if (error) throw error;
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamBoardSelect = (subjectId: string, examBoard: string) => {
    const currentBoards = data.examBoards || {};
    updateData({
      examBoards: {
        ...currentBoards,
        [subjectId]: examBoard
      }
    });
  };

  const handleApplyToAll = (examBoard: string) => {
    const allBoards = subjects.reduce((acc, subject) => {
      acc[subject.id] = examBoard;
      return acc;
    }, {} as Record<string, string>);
    
    updateData({ examBoards: allBoards });
  };

  const canProceed = subjects.every(subject => data.examBoards?.[subject.id]);

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
          Which exam boards? 📝
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Select the exam board for each subject so Cleo can tailor content to your syllabus
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-6">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{subjectEmojis[subject.name] || '📚'}</span>
                <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {examBoards.map((board) => (
                  <Button
                    key={board}
                    variant={data.examBoards?.[subject.id] === board ? 'default' : 'outline'}
                    onClick={() => handleExamBoardSelect(subject.id, board)}
                    className="w-full"
                  >
                    {board}
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-3">
              Use the same exam board for all subjects?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {examBoards.map((board) => (
                <Button
                  key={board}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyToAll(board)}
                  className="border-blue-300"
                >
                  Apply {board} to All
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {!canProceed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-500 text-center"
        >
          Please select an exam board for each subject
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

export default ExamBoardStep;
