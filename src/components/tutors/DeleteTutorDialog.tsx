
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

  if (!tutor && isOpen) {
    return null;
  }

  const handleDelete = async () => {
    if (!tutor) return;

    setIsDeleting(true);
    try {
      if (isHardDelete) {
        const { error } = await supabase
          .from('tutors')
          .delete()
          .eq('id', tutor.id);

        if (error) throw error;

        toast.success(`Tutor ${tutor.first_name} ${tutor.last_name} has been permanently deleted.`);
      } else {
        const { error } = await supabase
          .from('tutors')
          .update({ status: 'inactive' })
          .eq('id', tutor.id);

        if (error) throw error;

        toast.success(`${tutor.first_name} ${tutor.last_name} marked as inactive.`);
      }

      onDeleted();
      onClose();
    } catch (error: any) {
      console.error('Error deleting tutor:', error);
      toast.error(`Failed to delete tutor: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen && tutor !== null} onOpenChange={onClose}>
      <AlertDialogContent className="cc-dialog rounded-[var(--radius-soft)] border-0 shadow-[var(--shadow-soft-lg)] p-6 sm:p-8">
        {tutor && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
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
                      This will mark {tutor.first_name} {tutor.last_name} as inactive.
                    </p>
                    <p>
                      Their existing lessons stay on the calendar. Reassign or delete those
                      lessons from the calendar if they should not go ahead.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 flex items-center space-x-2 rounded-[1.25rem] bg-pastel-sand/50 p-3">
              <Switch
                id="hard-delete-mode"
                checked={isHardDelete}
                onCheckedChange={setIsHardDelete}
              />
              <Label htmlFor="hard-delete-mode">Permanently delete all data</Label>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="h-11 rounded-full border border-foreground px-5">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className={`h-11 rounded-full px-6 ${isHardDelete ? "bg-destructive hover:bg-destructive/90" : "bg-foreground text-background hover:opacity-90"}`}
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
