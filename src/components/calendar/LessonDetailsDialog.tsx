import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Check, Clock, BookOpen, Edit, Trash2, AlertTriangle } from 'lucide-react';
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

// This regex pattern matches the format we generate for recurring lessons: UUID-YYYY-MM-DD
const RECURRING_INSTANCE_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{4}-\d{2}-\d{2}$/;

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
  const [hasHomework, setHasHomework] = useState(false);
  const [homeworkDeleteOption, setHomeworkDeleteOption] = useState<'delete' | 'cancel'>('delete');
  const [isHomeworkDeleteConfirmOpen, setIsHomeworkDeleteConfirmOpen] = useState(false);

  // Function to check if the ID is a recurring instance ID using our specific format
  const isRecurringInstanceId = (id: string): boolean => {
    return RECURRING_INSTANCE_REGEX.test(id);
  };

  useEffect(() => {
    if (lessonId && isOpen) {
      console.log("Opening lesson details for ID:", lessonId);
      setLesson(null); // Reset lesson data
      setHasHomework(false); // Reset homework flag
      
      // Check if this is a recurring instance by looking for our specific ID format
      if (isRecurringInstanceId(lessonId)) {
        const parts = lessonId.split('-');
        // Extract the UUID part (first 5 segments with dashes)
        const baseId = parts.slice(0, 5).join('-');
        setOriginalLessonId(baseId);
        setIsRecurringInstance(true);
        
        // For recurring instances, fetch the original lesson and create an instance
        fetchRecurringInstance(baseId, lessonId);
        // Check if the original lesson has homework
        checkForHomework(baseId);
      } else {
        setOriginalLessonId(lessonId);
        setIsRecurringInstance(false);
        fetchLessonDetails(lessonId);
        // Check if this lesson has homework
        checkForHomework(lessonId);
      }
    } else {
      setLesson(null);
      setIsRecurringInstance(false);
      setOriginalLessonId(null);
      setHasHomework(false);
    }
  }, [lessonId, isOpen]);

  // Function to check if a lesson has homework assigned to it
  const checkForHomework = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('homework')
        .select('id')
        .eq('lesson_id', lessonId);

      if (error) {
        console.error("Error checking for homework:", error);
        return;
      }

      const hasAssignedHomework = data && data.length > 0;
      console.log(`Lesson ${lessonId} has homework:`, hasAssignedHomework, data);
      setHasHomework(hasAssignedHomework);
    } catch (error) {
      console.error("Error in checkForHomework:", error);
    }
  };

  const fetchRecurringInstance = async (originalId: string, instanceId: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching recurring instance data for original ID:", originalId, "and instance ID:", instanceId);
      
      // Get the original lesson data
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
        toast.error('Failed to load recurring lesson data');
        // Create a placeholder lesson if we can't fetch the original
        createPlaceholderLesson(instanceId);
        return;
      }

      if (!data) {
        console.error("No data returned for original lesson");
        toast.error('Recurring lesson not found');
        createPlaceholderLesson(instanceId);
        return;
      }

      // Extract the date part from the instance ID (format is uuid-YYYY-MM-DD)
      const dateParts = instanceId.split('-');
      const year = parseInt(dateParts[5], 10);
      const month = parseInt(dateParts[6], 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[7], 10);
      const instanceDate = new Date(year, month, day);
      
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
        students
      };
      
      console.log("Created instance lesson:", instanceLesson);
      setLesson(instanceLesson);
    } catch (error) {
      console.error('Error in fetchRecurringInstance:', error);
      toast.error('Failed to load recurring lesson data');
      createPlaceholderLesson(instanceId);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaceholderLesson = (instanceId: string) => {
    // Create a generic placeholder for instances we can't fully reconstruct
    const placeholderLesson: Lesson = {
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
    };
    
    setLesson(placeholderLesson);
    console.log("Using placeholder lesson data:", placeholderLesson);
  };

  const fetchLessonDetails = async (id: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching regular lesson details for ID:", id);
      
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

      if (error) {
        console.error('Error fetching lesson details:', error);
        toast.error('Failed to load lesson details');
        return;
      }

      if (!data) {
        console.error('No data returned for lesson details');
        toast.error('Lesson not found');
        return;
      }

      // Transform the data
      const students = data.lesson_students?.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name,
        attendance_status: ls.attendance_status || 'pending'
      })) || [];
        
      const processedLesson: Lesson = {
        ...data,
        students
      };
      
      console.log("Fetched and processed lesson:", processedLesson);
      setLesson(processedLesson);
    } catch (error) {
      console.error('Error in fetchLessonDetails:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = () => {
    // If lesson has homework assigned, show special confirmation dialog
    if (hasHomework) {
      setIsHomeworkDeleteConfirmOpen(true);
    } else {
      // If no homework, show regular delete confirmation
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!lesson || !onDelete) return;
    
    try {
      // If there is homework and user chose to delete it
      if (hasHomework && homeworkDeleteOption === 'delete') {
        // Delete associated homework first
        const lessonIdToUse = isRecurringInstance && originalLessonId ? originalLessonId : lesson.id;
        
        const { error: homeworkError } = await supabase
          .from('homework')
          .delete()
          .eq('lesson_id', lessonIdToUse);

        if (homeworkError) {
          console.error("Error deleting homework:", homeworkError);
          toast.error('Failed to delete associated homework');
          setIsDeleteConfirmOpen(false);
          setIsHomeworkDeleteConfirmOpen(false);
          return;
        }
        
        console.log("Successfully deleted associated homework for lesson:", lessonIdToUse);
      }

      // Now proceed with lesson deletion
      // If it's a recurring instance and "all future" is selected, pass the original ID
      if (isRecurringInstance && deleteOption === 'all' && originalLessonId) {
        onDelete(originalLessonId, true);
      } else {
        // Otherwise pass the current lesson ID (could be original or instance)
        onDelete(lesson.id, deleteOption === 'all');
      }
      
    } catch (error) {
      console.error("Error in confirmDeleteLesson:", error);
      toast.error('Failed to delete lesson');
    } finally {
      setIsDeleteConfirmOpen(false);
      setIsHomeworkDeleteConfirmOpen(false);
      onClose();
    }
  };

  const cancelDeleteLesson = () => {
    setIsDeleteConfirmOpen(false);
    setIsHomeworkDeleteConfirmOpen(false);
  };

  const handleCompleteSession = () => {
    if (lesson && onCompleteSession) {
      // For recurring instances, we need to use the original lesson ID
      const completionId = isRecurringInstance && originalLessonId ? originalLessonId : lesson.id;
      
      // Close this dialog first, then call the completion handler
      onClose();
      // Small delay to ensure the dialog is closed first
      setTimeout(() => {
        if (onCompleteSession) {
          onCompleteSession(completionId);
        }
      }, 100);
    }
  };
  
  const handleAssignHomework = () => {
    if (lesson) {
      // First close this dialog, then open the homework assignment dialog
      onClose();
      // Small delay to ensure the dialog is closed first
      setTimeout(() => {
        setIsAssigningHomework(true);
      }, 100);
    }
  };

  const handleHomeworkDialogClose = () => {
    setIsAssigningHomework(false);
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
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="sm:max-w-[550px]">
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
              {hasHomework && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-amber-500">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      This lesson has homework assigned
                    </span>
                  </div>
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
          
          <div className="flex flex-wrap justify-between gap-2 mt-4">
            <div>
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
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
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
                  size="sm"
                >
                  <Check className="h-4 w-4" />
                  Complete
                </Button>
              )}
              {lesson && lesson.status === 'completed' && (
                <Button 
                  className="flex items-center gap-1" 
                  variant="outline"
                  disabled
                  size="sm"
                >
                  <Clock className="h-4 w-4" />
                  Completed
                </Button>
              )}
              <Button variant="outline" onClick={onClose} size="sm">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regular delete confirmation dialog */}
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

      {/* Special confirmation dialog for lessons with homework */}
      <AlertDialog open={isHomeworkDeleteConfirmOpen} onOpenChange={setIsHomeworkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              This lesson has homework
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">The lesson "{lesson?.title}" has homework assigned to it. What would you like to do?</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <RadioGroup
                  value={homeworkDeleteOption}
                  onValueChange={(value) => setHomeworkDeleteOption(value as 'delete' | 'cancel')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="delete" id="delete-homework" />
                    <div>
                      <Label htmlFor="delete-homework" className="font-medium">Delete the lesson and its homework</Label>
                      <p className="text-xs text-muted-foreground">This will permanently delete both the lesson and any associated homework.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cancel" id="keep-homework" />
                    <div>
                      <Label htmlFor="keep-homework" className="font-medium">Cancel deletion</Label>
                      <p className="text-xs text-muted-foreground">Go back to the lesson details without deleting anything.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {(lesson?.is_recurring || lesson?.is_recurring_instance) && homeworkDeleteOption === 'delete' && (
                <div className="mt-4">
                  <p className="mb-2 font-medium">For recurring lessons:</p>
                  <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as 'single' | 'all')}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="single" id="homework-single" />
                      <Label htmlFor="homework-single">Delete only this instance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="homework-all" />
                      <Label htmlFor="homework-all">Delete this and all future instances</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteLesson}>Cancel</AlertDialogCancel>
            {homeworkDeleteOption === 'delete' ? (
              <AlertDialogAction onClick={confirmDeleteLesson} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={cancelDeleteLesson}>
                Go Back
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Only render AssignHomeworkDialog when isAssigningHomework is true */}
      {lesson && (
        <AssignHomeworkDialog
          isOpen={isAssigningHomework}
          onClose={handleHomeworkDialogClose}
          preSelectedLessonId={isRecurringInstance && originalLessonId ? originalLessonId : lesson.id}
        />
      )}
    </>
  );
};

export default LessonDetailsDialog;
