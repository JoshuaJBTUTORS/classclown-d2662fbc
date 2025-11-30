import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AVAILABLE_SUBJECTS, type AvailableSubject } from "@/types/onboarding";

interface SubjectSelectionStepProps {
  selectedSubjects: string[];
  onToggle: (subject: string) => void;
  onSelectAll: () => void;
}

const subjectIcons: Record<AvailableSubject, string> = {
  'Biology': '🧬',
  'Chemistry': '🧪',
  'Physics': '⚛️',
  'Maths': '📐',
  'English': '📚',
  'Computer Science': '💻',
};

export const SubjectSelectionStep = ({
  selectedSubjects,
  onToggle,
  onSelectAll,
}: SubjectSelectionStepProps) => {
  const allSelected = selectedSubjects.length === AVAILABLE_SUBJECTS.length;
  const hasError = selectedSubjects.length === 0;

  return (
    <div className="relative">
      {/* Cleo Avatar - Top Right */}
      <div className="absolute top-0 right-4 text-5xl">🧑🏻‍🔬</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 pt-16"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            What subjects interest you?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Select the subjects you'd like to study with Cleo
          </p>
          
          <Button
            variant="outline"
            onClick={onSelectAll}
            className="mb-4"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
          {AVAILABLE_SUBJECTS.map((subject, index) => {
            const isSelected = selectedSubjects.includes(subject);
            
            return (
              <motion.div
                key={subject}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all hover:shadow-md relative border-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onToggle(subject)}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center space-y-3">
                    <div className="text-5xl">{subjectIcons[subject]}</div>
                    <h3 className="text-lg font-semibold">{subject}</h3>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {hasError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-destructive text-sm"
          >
            Please select at least one subject to continue
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};
