
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useLessonDeletion } from '@/hooks/useLessonDeletion';

interface DeleteLessonButtonProps {
  lessonId: string;
  lessonTitle: string;
  onDeleted?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const DeleteLessonButton: React.FC<DeleteLessonButtonProps> = ({
  lessonId,
  lessonTitle,
  onDeleted,
  variant = 'destructive',
  size = 'sm'
}) => {
  const [loading, setLoading] = useState(false);
  const { deleteLesson } = useLessonDeletion();

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteLesson(lessonId);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={loading}
        >
          <Trash2 className="h-4 w-4" />
          {size !== 'icon' && (loading ? 'Deleting...' : 'Delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the lesson <strong>"{lessonTitle}"</strong>?
            </p>
            <p>
              This action cannot be undone and will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>The lesson and its details</li>
              <li>All homework assignments and submissions</li>
              <li>Attendance records</li>
              <li>Lesson plan assignments</li>
              <li>Whiteboard files</li>
              <li>Student enrollments</li>
              <li>Any recurring lesson groups (if this is the original lesson)</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Lesson'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLessonButton;
