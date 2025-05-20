
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Check, Clock, BookOpen } from 'lucide-react';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';

interface LessonDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  onSave?: (lesson: Lesson) => void;
  onDelete?: (lessonId: string) => void;
  onCompleteSession?: (lessonId: string) => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  isOpen,
  onClose,
  lessonId,
  onSave,
  onDelete,
  onCompleteSession
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);

  useEffect(() => {
    if (lessonId && isOpen) {
      fetchLessonDetails(lessonId);
    } else {
      setLesson(null);
    }
  }, [lessonId, isOpen]);

  const fetchLessonDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students!inner(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data
      if (data) {
        const students = data.lesson_students.map((ls: any) => ls.student);
        const processedLesson = {
          ...data,
          students,
          lesson_students: undefined
        };
        setLesson(processedLesson);
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = () => {
    if (lesson && onDelete) {
      onDelete(lesson.id);
      onClose();
    }
  };

  const handleCompleteSession = () => {
    if (lesson && onCompleteSession) {
      onCompleteSession(lesson.id);
      onClose();
    }
  };
  
  const handleAssignHomework = () => {
    if (lesson) {
      setIsAssigningHomework(true);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6 text-center">Loading lesson details...</div>
        ) : lesson ? (
          <div className="grid gap-4 py-4">
            <div>
              <h3 className="font-medium">Title</h3>
              <p>{lesson.title}</p>
            </div>
            <div>
              <h3 className="font-medium">Description</h3>
              <p>{lesson.description || 'No description provided'}</p>
            </div>
            <div>
              <h3 className="font-medium">Date & Time</h3>
              <p>{format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')} - {format(parseISO(lesson.end_time), 'h:mm a')}</p>
            </div>
            <div>
              <h3 className="font-medium">Tutor</h3>
              <p>{lesson.tutor ? `${lesson.tutor.first_name} ${lesson.tutor.last_name}` : 'Not assigned'}</p>
            </div>
            <div>
              <h3 className="font-medium">Students</h3>
              {lesson.students && lesson.students.length > 0 ? (
                <ul className="list-disc pl-5">
                  {lesson.students.map(student => (
                    <li key={student.id}>{student.first_name} {student.last_name}</li>
                  ))}
                </ul>
              ) : <p>No students assigned</p>}
            </div>
            {lesson.is_recurring && (
              <div>
                <h3 className="font-medium">Recurrence</h3>
                <p>
                  This is a recurring {lesson.recurrence_interval || 'weekly'} lesson 
                  {lesson.recurrence_end_date ? ` until ${format(parseISO(lesson.recurrence_end_date), 'MMM d, yyyy')}` : ''}
                </p>
              </div>
            )}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${lesson.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-sm font-medium">
                  Status: {lesson.status === 'completed' ? 'Completed' : 'Scheduled'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">No lesson data available</div>
        )}
        
        <div className="flex justify-between mt-4">
          {onDelete && lesson && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteLesson}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {lesson && (
              <Button
                className="flex items-center gap-1"
                onClick={handleAssignHomework}
                variant="outline"
                size="sm"
              >
                <BookOpen className="h-4 w-4" />
                Assign Homework
              </Button>
            )}
            {lesson && lesson.status !== 'completed' && onCompleteSession && (
              <Button 
                className="flex items-center gap-1" 
                onClick={handleCompleteSession}
                variant="default"
                size="lg"
              >
                <Check className="h-4 w-4" />
                Complete Session
              </Button>
            )}
            {lesson && lesson.status === 'completed' && (
              <Button 
                className="flex items-center gap-1" 
                variant="outline"
                disabled
              >
                <Clock className="h-4 w-4" />
                Completed
              </Button>
            )}
            {onSave && lesson && (
              <Button onClick={() => onSave(lesson)}>
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>

      {lesson && (
        <AssignHomeworkDialog
          isOpen={isAssigningHomework}
          onClose={() => setIsAssigningHomework(false)}
          preSelectedLessonId={lesson.id}
        />
      )}
    </Dialog>
  );
};

export default LessonDetailsDialog;
