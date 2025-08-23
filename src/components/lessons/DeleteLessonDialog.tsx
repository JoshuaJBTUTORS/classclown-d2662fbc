
import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Clock, Users, BookOpen, FileText } from 'lucide-react';
import { DeleteScope, lessonDeletionService, DeletionSummary } from '@/services/lessonDeletionService';

interface DeleteLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteScope: DeleteScope) => void;
  lessonTitle: string;
  isRecurring: boolean;
  isRecurringInstance: boolean;
  lessonId: string;
  isLoading?: boolean;
}

const DeleteLessonDialog: React.FC<DeleteLessonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lessonTitle,
  isRecurring,
  isRecurringInstance,
  lessonId,
  isLoading = false
}) => {
  const [deleteScope, setDeleteScope] = useState<DeleteScope>(DeleteScope.THIS_LESSON_ONLY);
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const showScopeSelection = isRecurring || isRecurringInstance;

  useEffect(() => {
    if (isOpen && lessonId) {
      loadDeletionSummary();
    }
  }, [isOpen, lessonId, deleteScope]);

  const loadDeletionSummary = async () => {
    setLoadingSummary(true);
    try {
      const summary = await lessonDeletionService.getAffectedLessonsCount(lessonId, deleteScope);
      setDeletionSummary(summary);
    } catch (error) {
      console.error('Error loading deletion summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(deleteScope);
  };

  const isBulkDelete = deleteScope === DeleteScope.ALL_RECURRING_LESSONS || deleteScope === DeleteScope.DELETE_FROM_DATE_ONWARDS;
  const lessonCount = deletionSummary?.lessonsToDelete || 1;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Lesson
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to delete <strong>"{lessonTitle}"</strong>
              </p>
              
              {showScopeSelection && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Delete Options:</Label>
                  <RadioGroup 
                    value={deleteScope} 
                    onValueChange={(value: DeleteScope) => setDeleteScope(value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DeleteScope.THIS_LESSON_ONLY} id="this-only" />
                      <Label htmlFor="this-only" className="text-sm">
                        Delete this lesson only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DeleteScope.DELETE_FROM_DATE_ONWARDS} id="from-date-onwards" />
                      <Label htmlFor="from-date-onwards" className="text-sm">
                        Delete this lesson and all future occurrences
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DeleteScope.ALL_RECURRING_LESSONS} id="all-recurring" />
                      <Label htmlFor="all-recurring" className="text-sm">
                        Delete all lessons in this recurring series
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {deletionSummary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isBulkDelete ? "destructive" : "secondary"} className="flex items-center gap-1">
                      {isBulkDelete ? (
                        <>
                          <Users className="h-3 w-3" />
                          {lessonCount} Lessons
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          1 Lesson
                        </>
                      )}
                    </Badge>
                  </div>

                  {(deletionSummary.hasHomework || deletionSummary.hasAttendance || deletionSummary.hasSubmissions) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-amber-800">
                            This will also delete:
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1">
                            {deletionSummary.hasAttendance && (
                              <li className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Attendance records
                              </li>
                            )}
                            {deletionSummary.hasHomework && (
                              <li className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                Homework assignments
                              </li>
                            )}
                            {deletionSummary.hasSubmissions && (
                              <li className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Student submissions
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading || loadingSummary}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              'Deleting...'
            ) : (
              `Delete ${lessonCount} Lesson${lessonCount !== 1 ? 's' : ''}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLessonDialog;
