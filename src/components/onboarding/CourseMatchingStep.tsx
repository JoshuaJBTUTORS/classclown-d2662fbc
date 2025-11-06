import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { courseMatchingService } from "@/services/courseMatchingService";
import { onboardingService } from "@/services/onboardingService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { OnboardingData } from "@/types/onboarding";

interface CourseMatchingStepProps {
  data: OnboardingData;
  userId: string;
}

interface SubjectStatus {
  subject: string;
  status: 'pending' | 'processing' | 'completed';
  wasCreated: boolean;
  courseId?: string;
}

export const CourseMatchingStep = ({ data, userId }: CourseMatchingStepProps) => {
  const [subjectStatuses, setSubjectStatuses] = useState<SubjectStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allComplete, setAllComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize subject statuses
    const statuses: SubjectStatus[] = data.subjects.map(subject => ({
      subject,
      status: 'pending',
      wasCreated: false,
    }));
    setSubjectStatuses(statuses);

    // Start processing
    processNextSubject(statuses, 0);
  }, []);

  const processNextSubject = async (statuses: SubjectStatus[], index: number) => {
    if (index >= statuses.length) {
      // All subjects processed, complete onboarding
      await completeOnboarding();
      return;
    }

    // Update status to processing
    const newStatuses = [...statuses];
    newStatuses[index].status = 'processing';
    setSubjectStatuses(newStatuses);
    setCurrentIndex(index);

    try {
      // Find or create course
      const result = await courseMatchingService.findOrCreateCourse(
        statuses[index].subject,
        data.yearGroupId,
        data.curriculum,
        userId
      );

      // Update status to completed
      newStatuses[index].status = 'completed';
      newStatuses[index].wasCreated = result.wasCreated;
      newStatuses[index].courseId = result.courseId;
      setSubjectStatuses(newStatuses);

      // Process next subject after a short delay
      setTimeout(() => {
        processNextSubject(newStatuses, index + 1);
      }, 500);
    } catch (error) {
      console.error('Error processing subject:', error);
      // Continue to next subject even if one fails
      newStatuses[index].status = 'completed';
      setSubjectStatuses(newStatuses);
      setTimeout(() => {
        processNextSubject(newStatuses, index + 1);
      }, 500);
    }
  };

  const completeOnboarding = async () => {
    try {
      await onboardingService.completeOnboarding(userId, data);
      setAllComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still set complete to allow user to proceed
      setAllComplete(true);
    }
  };

  const handleContinue = () => {
    navigate('/learning-hub');
  };

  if (allComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mb-8 text-6xl"
        >
          🎉
        </motion.div>
        <h2 className="text-4xl font-bold mb-4">Your Learning Dashboard is Ready!</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          We've set up {subjectStatuses.length} personalized course{subjectStatuses.length > 1 ? 's' : ''} for you.
          Let's start learning with Cleo!
        </p>
        <div className="flex gap-3 mb-8">
          {subjectStatuses.map((status, index) => (
            <motion.div
              key={status.subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full"
            >
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{status.subject}</span>
            </motion.div>
          ))}
        </div>
        <Button size="lg" onClick={handleContinue} className="px-8">
          Go to Dashboard
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4"
    >
      <div className="text-center mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-4"
        >
          <Sparkles className="h-12 w-12 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-3">Finding Your Perfect Courses...</h2>
        <p className="text-muted-foreground">
          Setting up your personalized learning experience
        </p>
      </div>

      <div className="space-y-4">
        {subjectStatuses.map((status, index) => (
          <motion.div
            key={status.subject}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
          >
            <div>
              {status.status === 'completed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-primary text-primary-foreground rounded-full p-2"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : status.status === 'processing' ? (
                <Loader2 className="h-9 w-9 text-primary animate-spin" />
              ) : (
                <div className="h-9 w-9 rounded-full border-2 border-muted" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{status.subject}</h3>
              <p className="text-sm text-muted-foreground">
                {status.status === 'completed'
                  ? status.wasCreated
                    ? '✨ Created new course'
                    : '✅ Enrolled in existing course'
                  : status.status === 'processing'
                  ? 'Processing...'
                  : 'Waiting...'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
