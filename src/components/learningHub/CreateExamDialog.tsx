import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService } from '@/services/aiAssessmentService';

interface CreateExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateExamDialog: React.FC<CreateExamDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { toast } = useToast();

  // Get all published assessments to extract available subjects
  const { data: assessments = [] } = useQuery({
    queryKey: ['publishedAssessments'],
    queryFn: aiAssessmentService.getPublishedAssessments,
    enabled: isOpen,
  });

  // Get unique subjects from published assessments
  const availableSubjects = Array.from(
    new Set(
      assessments
        .filter(assessment => assessment.subject && assessment.subject.trim() !== '')
        .map(assessment => assessment.subject!)
    )
  ).sort();

  const generateExamMutation = useMutation({
    mutationFn: async (subject: string) => {
      return aiAssessmentService.generateExamFromSubject(subject);
    },
    onSuccess: () => {
      toast({
        title: "Exam Generated",
        description: "Your exam has been successfully created from existing assessments",
      });
      setSelectedSubject('');
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate exam",
        variant: "destructive",
      });
    },
  });

  const handleGenerateExam = () => {
    if (!selectedSubject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject to generate an exam",
        variant: "destructive",
      });
      return;
    }

    generateExamMutation.mutate(selectedSubject);
  };

  const handleClose = () => {
    setSelectedSubject('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Exam</DialogTitle>
          <DialogDescription>
            Create an exam by combining questions from existing assessments of the selected subject.
            2 questions will be randomly selected from each published assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No subjects available
                  </SelectItem>
                ) : (
                  availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableSubjects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No published assessments with subjects found
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateExam}
              disabled={!selectedSubject || generateExamMutation.isPending}
            >
              {generateExamMutation.isPending ? 'Generating...' : 'Generate Exam'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;