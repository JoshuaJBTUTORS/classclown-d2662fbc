
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

interface DeleteTutorDialogProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteTutorDialog: React.FC<DeleteTutorDialogProps> = ({
  tutor,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [isHardDelete, setIsHardDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [futureCount, setFutureCount] = useState<number | null>(null);

  const tutorId = tutor?.id ?? null;

  React.useEffect(() => {
    if (!isOpen || !tutorId) return;
    setFutureCount(null);
    supabase.functions
      .invoke('stop-lessons', { body: { mode: 'tutor', tutorId, dryRun: true } })
      .then(({ data }) => setFutureCount((data as any)?.affectedLessons ?? 0))
      .catch(() => setFutureCount(null));
  }, [isOpen, tutorId]);

  // If tutor is null, we should not render the dialog contents
  if (!tutor && isOpen) {
    return null;
  }

  const handleDelete = async () => {
    if (!tutor) return; // Safety check
    
    setIsDeleting(true);
    try {
      if (isHardDelete) {
        // Hard delete - remove from database
        const { error } = await supabase
          .from('tutors')
          .delete()
          .eq('id', tutor.id);

        if (error) throw error;
        
        toast.success(`Tutor ${tutor.first_name} ${tutor.last_name} has been permanently deleted.`);
      } else {
        // Deactivate: marks inactive, ends their recurring series and clears
        // their upcoming sessions from the calendar.
        const { data, error } = await supabase.functions.invoke('stop-lessons', {
          body: { mode: 'tutor', tutorId: tutor.id },
        });

        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);

        const cancelled = (data as any)?.cancelledLessons ?? 0;
        toast.success(
          `${tutor.first_name} ${tutor.last_name} marked as inactive. ${cancelled} upcoming lesson${cancelled === 1 ? '' : 's'} cancelled.`
        );
      }
      
      onDeleted(); // Refresh the tutor list
      onClose();
    } catch (error: any) {
      console.error('Error deleting tutor:', error);
      toast.error(`Failed to delete tutor: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };


  // We only want to render the dialog content if we have a tutor
  // This prevents accessing properties of null
  return (
    <AlertDialog open={isOpen && tutor !== null} onOpenChange={onClose}>
      <AlertDialogContent>
        {tutor && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isHardDelete 
                  ? 'Permanently Delete Tutor' 
                  : 'Deactivate Tutor'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isHardDelete ? (
                  <>
                    <p className="mb-2 text-destructive font-semibold">
                      This action cannot be undone.
                    </p>
                    <p>
                      This will permanently delete {tutor.first_name} {tutor.last_name}'s 
                      record and all associated data, including lesson history and availability.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      This will mark {tutor.first_name} {tutor.last_name} as inactive, end their
                      recurring series and clear their upcoming sessions from the calendar.
                    </p>
                    <p className="mb-2">
                      {futureCount === null
                        ? 'Checking upcoming lessons...'
                        : `${futureCount} upcoming lesson${futureCount === 1 ? '' : 's'} will be cancelled. Reassign them to another tutor first if they should continue.`}
                    </p>
                    <p>
                      Past lessons and history are kept. You can reactivate the tutor later if needed.
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
                    : 'Deactivate Tutor'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTutorDialog;
