
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddLessonForm from './AddLessonForm';

interface AddLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddLessonDialog: React.FC<AddLessonDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
        </DialogHeader>
        <AddLessonForm 
          onLessonAdded={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonDialog;
