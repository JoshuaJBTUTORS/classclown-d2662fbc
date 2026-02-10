import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useYearGroups } from '@/hooks/useYearGroups';
import { getDemoLesson, getSubjectKey } from '@/data/lessons/demoLessons';
import { CleoInteractiveLearning } from '@/components/cleo/CleoInteractiveLearning';

const SUPPORTED_SUBJECTS = ['biology', 'chemistry', 'physics', 'maths', 'english', 'computer_science'];

const CleoDemo = () => {
  const navigate = useNavigate();
  const { subjects, isLoading: subjectsLoading } = useSubjects();
  const { yearGroups, isLoading: yearGroupsLoading } = useYearGroups();

  const [selectedYearGroup, setSelectedYearGroup] = useState<{ id: string; name: string; display_name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [phase, setPhase] = useState<'select' | 'demo'>('select');

  // Filter subjects to only those with demo lessons
  const availableSubjects = useMemo(() => {
    return subjects.filter(s => getSubjectKey(s.name) !== null);
  }, [subjects]);

  // Filter year groups to 7-11
  const availableYearGroups = useMemo(() => {
    return yearGroups.filter(yg => {
      const name = yg.name.toLowerCase();
      return name.includes('7') || name.includes('8') || name.includes('9') || name.includes('10') || name.includes('11');
    });
  }, [yearGroups]);

  const demoLesson = useMemo(() => {
    if (!selectedYearGroup || !selectedSubject) return null;
    return getDemoLesson(selectedYearGroup.name, selectedSubject.name);
  }, [selectedYearGroup, selectedSubject]);

  const handleStartDemo = () => {
    if (demoLesson) {
      setPhase('demo');
    }
  };

  const handleDemoComplete = () => {
    navigate('/heycleo/onboarding');
  };

  if (phase === 'demo' && demoLesson) {
    return (
      <CleoInteractiveLearning
        lessonData={demoLesson}
        isDemo={true}
        onDemoComplete={handleDemoComplete}
      />
    );
  }

  const isLoading = subjectsLoading || yearGroupsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-2 border-primary/10">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center bg-primary/10 rounded-full p-4">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Try Cleo — Your AI Tutor
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                Experience a quick lesson before setting up your account. Pick your year group and a subject to get started!
              </p>
            </div>

            {/* Year Group Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Your Year Group
              </label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {availableYearGroups.map(yg => (
                    <Button
                      key={yg.id}
                      variant={selectedYearGroup?.id === yg.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedYearGroup(yg)}
                      className="w-full"
                    >
                      {yg.display_name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject Selection */}
            <AnimatePresence>
              {selectedYearGroup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pick a Subject
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSubjects.map(subject => (
                      <Button
                        key={subject.id}
                        variant={selectedSubject?.id === subject.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSubject(subject)}
                        className="w-full"
                      >
                        {subject.name}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Demo Button */}
            <AnimatePresence>
              {selectedYearGroup && selectedSubject && demoLesson && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <Button
                    onClick={handleStartDemo}
                    size="lg"
                    className="w-full py-6 text-lg font-semibold group"
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Start Demo Lesson
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    ~2 minute lesson • {demoLesson.title}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip option */}
            <div className="text-center pt-2">
              <button
                onClick={() => navigate('/heycleo/onboarding')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                Skip demo and continue to setup →
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CleoDemo;
