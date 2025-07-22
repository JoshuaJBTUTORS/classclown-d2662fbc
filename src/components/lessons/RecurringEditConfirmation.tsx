
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock } from 'lucide-react';
import { EditScope } from '@/services/recurringLessonEditService';

interface RecurringEditConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  editScope: EditScope;
  affectedLessonsCount: number;
  lessonTitle: string;
  isLoading?: boolean;
}

const RecurringEditConfirmation: React.FC<RecurringEditConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  editScope,
  affectedLessonsCount,
  lessonTitle,
  isLoading = false
}) => {
  const isBulkEdit = editScope === EditScope.ALL_FUTURE_LESSONS;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Confirm Lesson Changes
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to make changes to <strong>"{lessonTitle}"</strong>
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant={isBulkEdit ? "destructive" : "secondary"} className="flex items-center gap-1">
                  {isBulkEdit ? (
                    <>
                      <Users className="h-3 w-3" />
                      All Future Lessons
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      This Lesson Only
                    </>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {affectedLessonsCount} lesson{affectedLessonsCount !== 1 ? 's' : ''} will be updated
                </span>
              </div>

              {isBulkEdit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> This will update {affectedLessonsCount} lessons including 
                    the original recurring lesson and all future instances. This action cannot be undone.
                  </p>
                </div>
              )}

              <p className="text-sm">
                {isBulkEdit 
                  ? 'All selected changes will be applied to the recurring lesson series.'
                  : 'Changes will only be applied to this specific lesson instance.'
                }
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className={isBulkEdit ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isLoading ? 'Updating...' : `Update ${affectedLessonsCount} Lesson${affectedLessonsCount !== 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RecurringEditConfirmation;
