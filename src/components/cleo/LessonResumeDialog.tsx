import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, X } from 'lucide-react';
import { LessonState } from '@/services/cleoLessonStateService';
import { formatDistanceToNow } from 'date-fns';

interface LessonResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onRestart: () => void;
  savedState: LessonState | null;
}

export const LessonResumeDialog: React.FC<LessonResumeDialogProps> = ({
  isOpen,
  onClose,
  onResume,
  onRestart,
  savedState,
}) => {
  if (!savedState) return null;

  const timeSincePause = savedState.paused_at 
    ? formatDistanceToNow(new Date(savedState.paused_at), { addSuffix: true })
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Resume Your Lesson
          </DialogTitle>
          <DialogDescription>
            You have a lesson in progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-semibold">{savedState.completion_percentage}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${savedState.completion_percentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Step</span>
              <span className="font-medium">Step {savedState.active_step + 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed Steps</span>
              <span className="font-medium">{savedState.completed_steps.length}</span>
            </div>
            {timeSincePause && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Activity</span>
                <span className="font-medium">{timeSincePause}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onResume} className="w-full" size="lg">
            <Play className="w-4 h-4 mr-2" />
            Resume from where I left off
          </Button>
          <Button onClick={onRestart} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Start from beginning
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
