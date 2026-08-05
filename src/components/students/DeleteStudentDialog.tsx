
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DeleteStudentDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteStudentDialog: React.FC<DeleteStudentDialogProps> = ({
  student,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [isHardDelete, setIsHardDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentId = student
    ? (typeof student.id === 'string' ? parseInt(student.id, 10) : student.id)
    : null;

  if (!student || studentId === null) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isHardDelete) {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (error) throw error;

        toast.success(`Student ${student.first_name} ${student.last_name} has been permanently deleted.`);
      } else {
        const { error } = await supabase
          .from('students')
          .update({ status: 'inactive' })
          .eq('id', studentId);

        if (error) throw error;

        toast.success(`${student.first_name} ${student.last_name} marked as inactive.`);
      }

      onDeleted();
      onClose();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(`Failed to delete student: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isHardDelete
              ? 'Permanently Delete Student'
              : 'Deactivate Student'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isHardDelete ? (
              <>
                <p className="mb-2 text-destructive font-semibold">
                  This action cannot be undone.
                </p>
                <p>
                  This will permanently delete {student.first_name} {student.last_name}'s
                  record and all associated data, including lesson history and homework submissions.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  This will mark {student.first_name} {student.last_name} as inactive.
                </p>
                <p>
                  Their lessons stay on the calendar. To stop future sessions, delete the
                  lessons from the calendar and choose "this lesson and all future occurrences"
                  or "all lessons in this recurring series".
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 my-4">
          <Switch
            id="hard-delete-mode"
            checked={isHardDelete}
            onCheckedChange={setIsHardDelete}
          />
          <Label htmlFor="hard-delete-mode">Permanently delete all data</Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className={isHardDelete ? "bg-destructive hover:bg-destructive/90" : ""}
            disabled={isDeleting}
          >
            {isDeleting
              ? 'Processing...'
              : isHardDelete
                ? 'Yes, Delete Permanently'
                : 'Deactivate Student'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteStudentDialog;
