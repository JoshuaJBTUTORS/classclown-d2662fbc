
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
  const [futureCount, setFutureCount] = useState<number | null>(null);

  const studentId = student
    ? (typeof student.id === 'string' ? parseInt(student.id, 10) : student.id)
    : null;

  React.useEffect(() => {
    if (!isOpen || studentId === null) return;
    setFutureCount(null);
    supabase.functions
      .invoke('stop-lessons', { body: { mode: 'student', studentId, dryRun: true } })
      .then(({ data }) => setFutureCount((data as any)?.affectedLessons ?? 0))
      .catch(() => setFutureCount(null));
  }, [isOpen, studentId]);

  // Don't render if student is null
  if (!student || studentId === null) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isHardDelete) {
        // Hard delete - remove from database
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (error) throw error;
        
        toast.success(`Student ${student.first_name} ${student.last_name} has been permanently deleted.`);
      } else {
        // Stop lessons: marks the student as stopped, ends their recurring series
        // and clears their upcoming sessions from the calendar.
        const { data, error } = await supabase.functions.invoke('stop-lessons', {
          body: { mode: 'student', studentId },
        });

        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);

        const cancelled = (data as any)?.cancelledLessons ?? 0;
        toast.success(
          `${student.first_name} ${student.last_name} marked as stopped. ${cancelled} upcoming lesson${cancelled === 1 ? '' : 's'} cancelled.`
        );
      }
      
      onDeleted(); // Refresh the student list
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
              : 'Stop Lessons for Student'}
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
                  This will mark {student.first_name} {student.last_name} as stopped, end any
                  recurring series they are on, and clear their upcoming sessions from the calendar.
                </p>
                <p className="mb-2">
                  {futureCount === null
                    ? 'Checking upcoming lessons...'
                    : `${futureCount} upcoming lesson${futureCount === 1 ? '' : 's'} will be removed.`}
                </p>
                <p>
                  Past lessons and history are kept. You can set them back to active later if needed.
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
