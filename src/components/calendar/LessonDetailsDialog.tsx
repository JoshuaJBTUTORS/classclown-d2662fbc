
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Check, Clock, BookOpen, Edit, Trash2 } from 'lucide-react';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface LessonDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  onSave?: (lesson: Lesson) => void;
  onDelete?: (lessonId: string, deleteAllFuture?: boolean) => void;
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'single' | 'all'>('single');
  const [originalLessonId, setOriginalLessonId] = useState<string | null>(null);
  const [isRecurringInstance, setIsRecurringInstance] = useState(false);

  useEffect(() => {
    if (lessonId && isOpen) {
      console.log("Opening lesson details for ID:", lessonId);
      // Check if this is a recurring instance by looking for a dash in the ID
      if (lessonId.includes('-')) {
        const parts = lessonId.split('-');
        const baseId = parts[0];
        setOriginalLessonId(baseId);
        setIsRecurringInstance(true);
        
        // For recurring instances, fetch the original lesson and create a temporary instance
        fetchRecurringInstanceData(baseId, lessonId);
      } else {
        setOriginalLessonId(lessonId);
        setIsRecurringInstance(false);
        fetchLessonDetails(lessonId);
      }
    } else {
      setLesson(null);
      setIsRecurringInstance(false);
      setOriginalLessonId(null);
    }
  }, [lessonId, isOpen]);

  const fetchRecurringInstanceData = async (originalId: string, instanceId: string) => {
    setIsLoading(true);
    try {
      // Get the original lesson data from the database
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name),
            attendance_status
          )
        `)
        .eq('id', originalId)
        .single();

      if (error) {
        console.error("Error fetching original lesson:", error);
        // Fall back to a minimal representation
        createGenericRecurringInstance(instanceId);
        return;
      }

      // Extract the date part from the instance ID
      const datePart = instanceId.split('-').slice(1).join('-');
      
      try {
        // Parse the date from the ID
        const instanceDate = parseISO(datePart);
        
        // Transform students data
        const students = data.lesson_students?.map((ls: any) => ({
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name,
          attendance_status: ls.attendance_status || 'pending'
        })) || [];
        
        // Get the time part from the original lesson
        const startDate = parseISO(data.start_time);
        const endDate = parseISO(data.end_time);
        
        // Create the instance lesson with the correct date
        const instanceLesson: Lesson = {
          ...data,
          id: instanceId,
          start_time: format(instanceDate, "yyyy-MM-dd") + 
                      format(startDate, "'T'HH:mm:ss"),
          end_time: format(instanceDate, "yyyy-MM-dd") + 
                   format(endDate, "'T'HH:mm:ss"),
          is_recurring_instance: true,
          students,
          lesson_students: undefined
        };
        
        setLesson(instanceLesson);
      } catch (error) {
        console.error('Error processing instance date:', error);
        createGenericRecurringInstance(instanceId);
      }
    } catch (error) {
      console.error('Error in fetchRecurringInstanceData:', error);
      createGenericRecurringInstance(instanceId);
    } finally {
      setIsLoading(false);
    }
  };

  const createGenericRecurringInstance = (instanceId: string) => {
    // Create a generic placeholder for recurring instances we can't fully reconstruct
    setLesson({
      id: instanceId,
      title: "Recurring Lesson",
      description: "This is a recurring lesson instance. Some details may not be available.",
      start_time: "",
      end_time: "",
      is_group: false,
      status: "scheduled",
      tutor_id: "",
      is_recurring: true,
      is_recurring_instance: true,
      recurrence_interval: "weekly"
    });
  };

  const fetchLessonDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name),
            attendance_status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data
      if (data) {
        const students = data.lesson_students.map((ls: any) => ({
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name,
          attendance_status: ls.attendance_status || 'pending'
        }));
        
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
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLesson = () => {
    if (lesson && onDelete) {
      // If it's a recurring instance and "all future" is selected, pass the original ID
      if (isRecurringInstance && deleteOption === 'all' && originalLessonId) {
        onDelete(originalLessonId, true);
      } else {
        // Otherwise pass the current lesson ID (could be original or instance)
        onDelete(lesson.id, deleteOption === 'all');
      }
      setIsDeleteConfirmOpen(false);
      onClose();
    }
  };

  const cancelDeleteLesson = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleCompleteSession = () => {
    if (lesson && onCompleteSession) {
      // For recurring instances, we need to use the original lesson ID
      const completionId = isRecurringInstance && originalLessonId ? originalLessonId : lesson.id;
      onCompleteSession(completionId);
      onClose();
    }
  };
  
  const handleAssignHomework = () => {
    if (lesson) {
      setIsAssigningHomework(true);
    }
  };

  const handleEditLesson = () => {
    if (lesson && onSave) {
      onSave(lesson);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lesson Details</DialogTitle>
            <DialogDescription>
              View and manage lesson information
            </DialogDescription>
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
                <p>
                  {lesson.start_time ? 
                    `${format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')} - ${format(parseISO(lesson.end_time), 'h:mm a')}` : 
                    'Time information not available'
                  }
                </p>
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
              {(lesson.is_recurring || lesson.is_recurring_instance) && (
                <div>
                  <h3 className="font-medium">Recurrence</h3>
                  <p>
                    This is {lesson.is_recurring_instance ? 'part of a' : 'a'} recurring {lesson.recurrence_interval || 'weekly'} lesson 
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
                className="flex items-center gap-1"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
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
              {lesson && onSave && (
                <Button 
                  onClick={handleEditLesson} 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
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
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session "{lesson?.title}".
              {(lesson?.is_recurring || lesson?.is_recurring_instance) && (
                <div className="mt-4">
                  <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as 'single' | 'all')}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Delete only this instance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">Delete this and all future instances</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteLesson}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLesson} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lesson && (
        <AssignHomeworkDialog
          isOpen={isAssigningHomework}
          onClose={() => setIsAssigningHomework(false)}
          preSelectedLessonId={isRecurringInstance && originalLessonId ? originalLessonId : lesson.id}
        />
      )}
    </>
  );
};

export default LessonDetailsDialog;
