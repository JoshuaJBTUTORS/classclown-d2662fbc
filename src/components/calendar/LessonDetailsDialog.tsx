// This is a placeholder file since the original LessonDetailsDialog.tsx wasn't provided in the input.
// In a real implementation, this file would contain a React component for displaying lesson details.
// The component would likely include:
// - A dialog/modal UI
// - Fields to display lesson information
// - Possibly form elements to edit lesson details
// - Buttons for actions like save, cancel, delete

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/types/lesson';

interface LessonDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave?: (lesson: Lesson) => void;
  onDelete?: (lessonId: string) => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  open,
  onOpenChange,
  lesson,
  onSave,
  onDelete
}) => {
  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="font-medium">Title</h3>
            <p>{lesson.title}</p>
          </div>
          <div>
            <h3 className="font-medium">Description</h3>
            <p>{lesson.description}</p>
          </div>
          <div>
            <h3 className="font-medium">Date & Time</h3>
            <p>{new Date(lesson.start_time).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between">
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={() => onDelete(lesson.id)}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
