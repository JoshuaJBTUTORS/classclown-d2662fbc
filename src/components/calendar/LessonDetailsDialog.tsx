import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Check, Clock, BookOpen, Edit, Trash2, AlertTriangle, Video, Plus } from 'lucide-react';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLessonSpace } from '@/hooks/useLessonSpace';
import { useAuth } from '@/contexts/AuthContext';

interface LessonDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  onSave?: (lesson: Lesson) => void;
  onDelete?: (lessonId: string, deleteAllFuture?: boolean) => void;
  onCompleteSession?: (lessonId: string) => void;
  onAssignHomework?: (lessonId: string, lessonData: any) => void;
  onRefresh?: () => void;
}

// This regex pattern matches the format we generate for recurring lessons: UUID-YYYY-MM-DD
const RECURRING_INSTANCE_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{4}-\d{2}-\d{2}$/;

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  isOpen,
  onClose,
  lessonId,
  onSave,
  onDelete,
  onCompleteSession,
  onAssignHomework,
  onRefresh
}) => {
  const { userRole } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'single' | 'all'>('single');
  const [originalLessonId, setOriginalLessonId] = useState<string | null>(null);
  const [isRecurringInstance, setIsRecurringInstance] = useState(false);
  const [hasHomework, setHasHomework] = useState(false);
  const [homeworkDeleteOption, setHomeworkDeleteOption] = useState<'delete' | 'cancel'>('delete');
  const [isHomeworkDeleteConfirmOpen, setIsHomeworkDeleteConfirmOpen] = useState(false);
  const [preloadedLessonData, setPreloadedLessonData] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [studentUrls, setStudentUrls] = useState<Array<{url: string, studentName: string}>>([]);
  
  // Add Lesson Space integration
  const { createRoom, isCreatingRoom } = useLessonSpace();

  // Function to check if the ID is a recurring instance ID using our specific format
  const isRecurringInstanceId = (id: string): boolean => {
    return RECURRING_INSTANCE_REGEX.test(id);
  };

  useEffect(() => {
    if (lessonId && isOpen) {
      console.log("Opening lesson details for ID:", lessonId);
      setLesson(null);
      setHasHomework(false);
      setStudentUrls([]);
      
      if (isRecurringInstanceId(lessonId)) {
        const parts = lessonId.split('-');
        const baseId = parts.slice(0, 5).join('-');
        setOriginalLessonId(baseId);
        setIsRecurringInstance(true);
        
        fetchRecurringInstance(baseId, lessonId);
        checkForHomework(baseId);
      } else {
        setOriginalLessonId(lessonId);
        setIsRecurringInstance(false);
        fetchLessonDetails(lessonId);
        checkForHomework(lessonId);
      }
    } else {
      setLesson(null);
      setIsRecurringInstance(false);
      setOriginalLessonId(null);
      setHasHomework(false);
      setPreloadedLessonData(null);
      setStudentUrls([]);
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
      
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name),
            attendance_status,
            lesson_space_url
          )
        `)
        .eq('id', originalId)
        .single();

      if (error) {
        console.error("Error fetching original lesson:", error);
        toast.error('Failed to load recurring lesson data');
        createPlaceholderLesson(instanceId);
        return;
      }

      if (!data) {
        console.error("No data returned for original lesson");
        toast.error('Recurring lesson not found');
        createPlaceholderLesson(instanceId);
        return;
      }

      setPreloadedLessonData(data);

      // Extract student URLs for tutors/admins
      if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && data.lesson_students) {
        const urls = data.lesson_students
          .filter(ls => ls.lesson_space_url)
          .map(ls => ({
            url: ls.lesson_space_url,
            studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
          }));
        setStudentUrls(urls);
      }

      const dateParts = instanceId.split('-');
      const year = parseInt(dateParts[5], 10);
      const month = parseInt(dateParts[6], 10) - 1;
      const day = parseInt(dateParts[7], 10);
      const instanceDate = new Date(year, month, day);
      
      const students = data.lesson_students?.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name,
        attendance_status: ls.attendance_status || 'pending'
      })) || [];
      
      const startDate = parseISO(data.start_time);
      const endDate = parseISO(data.end_time);
      
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
            attendance_status,
            lesson_space_url
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
      
      setPreloadedLessonData(data);

      // Extract student URLs for tutors/admins
      if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && data.lesson_students) {
        const urls = data.lesson_students
          .filter(ls => ls.lesson_space_url)
          .map(ls => ({
            url: ls.lesson_space_url,
            studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
          }));
        setStudentUrls(urls);
      }

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

  const handleCreateOnlineRoom = async () => {
    if (!lesson) return;
    
    try {
      const result = await createRoom({
        lessonId: lesson.id,
        title: lesson.title,
        startTime: lesson.start_time,
        duration: lesson.end_time ? 
          Math.ceil((new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / (1000 * 60)) : 
          60
      });

      if (result) {
        // Refresh lesson data to get the updated room information
        if (isRecurringInstanceId(lesson.id)) {
          const parts = lesson.id.split('-');
          const baseId = parts.slice(0, 5).join('-');
          await fetchRecurringInstance(baseId, lesson.id);
        } else {
          await fetchLessonDetails(lesson.id);
        }
        
        toast.success('Online room created! Room details have been updated.');
      }
    } catch (error) {
      console.error('Error creating online room:', error);
    }
  };

  const handleEditLesson = () => {
    if (lesson) {
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSuccess = () => {
    // Close the edit dialog
    setIsEditDialogOpen(false);
    
    // Refresh the lesson data
    if (lesson) {
      if (isRecurringInstanceId(lesson.id)) {
        const parts = lesson.id.split('-');
        const baseId = parts.slice(0, 5).join('-');
        fetchRecurringInstance(baseId, lesson.id);
      } else {
        fetchLessonDetails(lesson.id);
      }
    }
    
    // Call the onRefresh callback if provided
    if (onRefresh) {
      onRefresh();
    }
    
    toast.success('Lesson updated successfully');
  };

  const handleDeleteLesson = () => {
    if (hasHomework) {
      setIsHomeworkDeleteConfirmOpen(true);
    } else {
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!lesson || !onDelete) return;
    
    try {
      if (hasHomework && homeworkDeleteOption === 'delete') {
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

      if (isRecurringInstance && deleteOption === 'all' && originalLessonId) {
        onDelete(originalLessonId, true);
      } else {
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
      const completionId = isRecurringInstance && originalLessonId ? originalLessonId : lesson.id;
      
      onClose();
      setTimeout(() => {
        if (onCompleteSession) {
          onCompleteSession(completionId);
        }
      }, 100);
    }
  };
  
  const handleCompleteLesson = () => {
    if (lesson && onAssignHomework) {
      const lessonIdToUse = isRecurringInstance && originalLessonId ? originalLessonId : lesson.id;
      onAssignHomework(lessonIdToUse, preloadedLessonData);
    }
  };

  if (!isOpen) return null;

  // Get the lesson ID to use for editing (base lesson ID for recurring instances)
  const editLessonId = isRecurringInstance && originalLessonId ? originalLessonId : lesson?.id || null;

  // Determine the appropriate video conference link based on user role
  let displayVideoLink = lesson?.video_conference_link || lesson?.lesson_space_room_url;
  
  // For students, prioritize their individual URL
  if (userRole === 'student' && lesson?.lesson_students && lesson.lesson_students.length > 0) {
    const studentLessonData = lesson.lesson_students.find(ls => ls.lesson_space_url);
    if (studentLessonData?.lesson_space_url) {
      displayVideoLink = studentLessonData.lesson_space_url;
    }
  }

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

              {/* Enhanced Video Conference Section with role-specific URLs */}
              {(displayVideoLink || studentUrls.length > 0) ? (
                <VideoConferenceLink 
                  link={displayVideoLink}
                  provider={lesson.video_conference_provider}
                  className="mb-4"
                  userRole={userRole as 'tutor' | 'student' | 'admin' | 'owner'}
                  isGroupLesson={lesson.is_group}
                  studentCount={lesson.students?.length || 0}
                  studentUrls={studentUrls}
                />
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">Online Lesson Room</h3>
                      <p className="text-sm text-muted-foreground">
                        {lesson.is_group 
                          ? `No group room created yet (${lesson.students?.length || 0} students)`
                          : 'No room created yet'
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateOnlineRoom}
                      disabled={isCreatingRoom}
                      className="flex items-center gap-2"
                    >
                      {isCreatingRoom ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          {lesson.is_group ? 'Create Group Room' : 'Create Room'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

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
              {lesson && onAssignHomework && (
                <Button
                  className="flex items-center gap-1"
                  onClick={handleCompleteLesson}
                  variant="outline"
                  size="sm"
                >
                  <Check className="h-4 w-4" />
                  Complete Lesson
                </Button>
              )}
              {lesson && (
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

      {/* Edit Lesson Dialog */}
      <EditLessonForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        lessonId={editLessonId}
      />

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
    </>
  );
};

export default LessonDetailsDialog;
