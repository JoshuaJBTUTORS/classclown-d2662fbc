import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AIAssessmentViewer from './AIAssessmentViewer';

interface ModuleAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onAssessmentComplete: (score: number) => void;
}

const ModuleAssessmentDialog: React.FC<ModuleAssessmentDialogProps> = ({
  isOpen,
  onClose,
  assessmentId,
  onAssessmentComplete
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Module Assessment</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <AIAssessmentViewer
            assessmentId={assessmentId}
            embedded={true}
            onAssessmentComplete={onAssessmentComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleAssessmentDialog;