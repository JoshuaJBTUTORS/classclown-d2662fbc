import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AVAILABLE_SUBJECTS } from "@/types/onboarding";

interface SubjectSelectionStepProps {
  selectedSubjects: string[];
  onToggle: (subject: string) => void;
  onSelectAll: () => void;
}

const subjectIcons: Record<string, string> = {
  'Biology': '🧬',
  'Chemistry': '⚗️',
  'Physics': '⚛️',
  'Maths': '🔢',
  'English': '📚',
  'Computer Science': '💻',
};

export const SubjectSelectionStep = ({
  selectedSubjects,
  onToggle,
  onSelectAll,
}: SubjectSelectionStepProps) => {
  const allSelected = selectedSubjects.length === AVAILABLE_SUBJECTS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What subjects would you like to learn?</h2>
        <p className="text-muted-foreground mb-4">
          Select at least one subject to get started
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="mb-4"
        >
          {allSelected ? 'Deselect All' : 'Select All Subjects'}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {AVAILABLE_SUBJECTS.map((subject, index) => {
          const isSelected = selectedSubjects.includes(subject);
          return (
            <motion.div
              key={subject}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`p-8 cursor-pointer transition-all relative border-2 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
                onClick={() => onToggle(subject)}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1"
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                )}
                <div className="text-center">
                  <motion.div
                    className="text-5xl mb-4"
                    animate={isSelected ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {subjectIcons[subject]}
                  </motion.div>
                  <h3 className="text-xl font-bold">{subject}</h3>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selectedSubjects.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-destructive mt-6"
        >
          Please select at least one subject to continue
        </motion.p>
      )}
    </motion.div>
  );
};
