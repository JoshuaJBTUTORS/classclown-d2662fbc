
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddLessonForm from './AddLessonForm';

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddLessonDialog: React.FC<AddLessonDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
        </DialogHeader>
        <AddLessonForm
          onLessonAdded={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonDialog;
