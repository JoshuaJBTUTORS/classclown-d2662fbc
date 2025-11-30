import React from 'react';
import { AlertTriangle, Clock, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranscriptWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
  transcriptStatus: 'processing' | 'completed' | 'not_found' | 'error';
}

const TranscriptWarningDialog: React.FC<TranscriptWarningDialogProps> = ({
  isOpen,
  onClose,
  onContinueAnyway,
  transcriptStatus
}) => {
  const getStatusInfo = () => {
    switch (transcriptStatus) {
      case 'processing':
        return {
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          title: 'Transcript Still Processing',
          message: 'The lesson transcript is still being generated. For the best assessment quality, we recommend waiting for the transcript to complete.',
          recommendation: 'Wait for transcript completion for optimal results'
        };
      case 'not_found':
        return {
          icon: <FileText className="h-4 w-4 text-gray-500" />,
          title: 'No Transcript Available',
          message: 'No transcript was found for this lesson. The assessment will be generated using lesson summaries and basic information only.',
          recommendation: 'Assessment will use available lesson data'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          title: 'Transcript Error',
          message: 'There was an error processing the transcript for this lesson. The assessment will be generated without transcript data.',
          recommendation: 'Assessment will use available lesson data'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-gray-500" />,
          title: 'Transcript Status Unknown',
          message: 'Unable to determine transcript status.',
          recommendation: 'Proceed with caution'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {statusInfo.message}
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Why transcripts matter</h4>
                <p className="text-sm text-blue-700">
                  Transcripts provide detailed lesson content that helps AI generate more accurate, 
                  relevant assessment questions that truly reflect what was taught and discussed.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Recommendation:</strong> {statusInfo.recommendation}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {transcriptStatus === 'processing' ? 'Wait for Transcript' : 'Cancel'}
          </Button>
          <Button onClick={onContinueAnyway} variant="default">
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptWarningDialog;