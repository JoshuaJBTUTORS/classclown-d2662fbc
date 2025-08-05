import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Users, MapPin, Calendar, Video, Loader2, ExternalLink, AlertCircle, Shield, UserCheck, CheckCircle, Circle, BookOpen, Edit, Trash2, Play } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import StudentAttendanceRow from '@/components/lessons/StudentAttendanceRow';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import DeleteLessonDialog from '@/components/lessons/DeleteLessonDialog';
import StudentLessonSummary from './StudentLessonSummary';
import { DeleteScope, lessonDeletionService } from '@/services/lessonDeletionService';
interface LessonDetailsDialogProps {
  lessonId: string | null;
  demoSessionId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLessonUpdated?: () => void;
  instanceDate?: string;
  instanceStart?: string;
  instanceEnd?: string;
}
const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lessonId,
  demoSessionId,
  isOpen,
  onClose,
  onLessonUpdated,
  instanceDate,
  instanceStart,
  instanceEnd
}) => {
  const [lesson, setLesson] = useState<any>(null);
  const [demoSession, setDemoSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState({
    allMarked: false,
    totalStudents: 0,
    markedCount: 0
  });
  const [homeworkStatus, setHomeworkStatus] = useState({
    exists: false,
    homework: null
  });
  const [isProcessed, setIsProcessed] = useState(false);
  const {
    userRole,
    isAdmin,
    isOwner,
    isTutor
  } = useAuth();

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  // Check if user can edit lessons (admin/owner only)
  const canEditLesson = isAdmin || isOwner;

  // Check if user can delete lessons (admin/owner only)
  const canDeleteLesson = isAdmin || isOwner;

  // Check if this is a recurring instance
  const isRecurringInstance = Boolean(instanceDate && instanceStart && instanceEnd);
  
  // Check if this is the specific GCSE Maths lesson for demo button
  const isTargetGCSELesson = lesson?.id === '1c3a8bed-ac82-45f9-8ce9-9fc336abcdf8' && 
    lesson?.subject === 'Year 11 Maths Highier' && 
    lesson?.title === 'GCSE Maths ';
  
  // Handle process lesson button click
  const handleProcessLesson = () => {
    setIsProcessed(true);
    toast.success('Lesson processed successfully!');
  };
  
  // Reset processed state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessed(false);
    }
  }, [isOpen]);
  useEffect(() => {
    if (lessonId && isOpen) {
      if (demoSessionId) {
        fetchDemoSession();
      } else {
        fetchLesson();
      }
    }
  }, [lessonId, demoSessionId, isOpen]);
  const fetchDemoSession = async () => {
    if (!demoSessionId || !lessonId) return;
    setIsLoading(true);
    try {
      // Fetch demo session with admin and lesson data
      const { data: demoData, error: demoError } = await supabase
        .from('demo_sessions')
        .select(`
          *,
          lessons!inner(
            *,
            tutor:tutors(id, first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name, email)
            )
          )
        `)
        .eq('id', demoSessionId)
        .single();

      if (demoError) throw demoError;

      // Fetch admin details
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles!user_roles_user_id_fkey(first_name, last_name)
        `)
        .eq('user_id', demoData.admin_id)
        .eq('role', 'admin')
        .single();

      if (adminError) {
        console.error('Error fetching admin details:', adminError);
        // Try alternative approach
        const { data: altAdminData, error: altError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', demoData.admin_id)
          .single();
        
        if (!altError && altAdminData) {
          setDemoSession({
            ...demoData,
            admin: altAdminData
          });
        } else {
          console.warn('Could not fetch admin details with fallback:', altError);
          setDemoSession({
            ...demoData,
            admin: null
          });
        }
      } else {
        setDemoSession({
          ...demoData,
          admin: adminData?.profiles || null
        });
      }
      
      setLesson(demoData.lessons);

      // Check attendance and homework status for the lesson
      await Promise.all([checkAttendanceStatus(lessonId), checkHomeworkStatus(lessonId)]);
    } catch (error) {
      console.error('Error fetching demo session:', error);
      toast.error('Failed to load demo session details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLesson = async () => {
    if (!lessonId) return;
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('lessons').select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, email)
          )
        `).eq('id', lessonId).single();
      if (error) throw error;

      // Add debugging logs to identify null student records
      console.log('Raw lesson data:', data);
      if (data?.lesson_students) {
        console.log('Lesson students:', data.lesson_students);
        const nullStudents = data.lesson_students.filter(ls => !ls.student);
        if (nullStudents.length > 0) {
          console.warn('Found null student records:', nullStudents);
        }
      }
      setLesson(data);
      setDemoSession(null);

      // Check attendance and homework status
      await Promise.all([checkAttendanceStatus(lessonId), checkHomeworkStatus(lessonId)]);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };
  const checkAttendanceStatus = async (lessonId: string) => {
    try {
      const {
        data: attendanceData
      } = await supabase.from('lesson_attendance').select('student_id, attendance_status').eq('lesson_id', lessonId);
      const {
        data: lessonStudents
      } = await supabase.from('lesson_students').select('student_id').eq('lesson_id', lessonId);
      const totalStudents = lessonStudents?.length || 0;
      const markedCount = attendanceData?.length || 0;
      const allMarked = totalStudents > 0 && markedCount >= totalStudents;
      setAttendanceStatus({
        allMarked,
        totalStudents,
        markedCount
      });
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };
  const checkHomeworkStatus = async (lessonId: string) => {
    try {
      const {
        data: homework
      } = await supabase.from('homework').select('*').eq('lesson_id', lessonId).maybeSingle();
      setHomeworkStatus({
        exists: !!homework,
        homework: homework
      });
    } catch (error) {
      // No homework found is expected, not an error
      setHomeworkStatus({
        exists: false,
        homework: null
      });
    }
  };
  const handleCreateLessonSpaceRoom = async () => {
    if (!lesson?.id) return;
    setIsCreatingRoom(true);
    try {
      console.log('Creating LessonSpace room for lesson:', lesson.id);
      const {
        data,
        error
      } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          tutorName: `${lesson.tutor?.first_name} ${lesson.tutor?.last_name}`,
          startTime: lesson.start_time,
          endTime: lesson.end_time,
          isGroupLesson: lesson.is_group || false
        }
      });
      if (error) {
        console.error('Error creating LessonSpace room:', error);
        toast.error(`Failed to create video room: ${error.message}`);
        return;
      }
      if (data?.success) {
        console.log('LessonSpace room created successfully:', data);
        toast.success('Video room created successfully!');
        await fetchLesson(); // Refresh lesson data
        onLessonUpdated?.();
      } else {
        console.error('Failed to create LessonSpace room:', data);
        toast.error(data?.error || 'Failed to create video room');
      }
    } catch (error: any) {
      console.error('Error in handleCreateLessonSpaceRoom:', error);
      toast.error('Failed to create video room');
    } finally {
      setIsCreatingRoom(false);
    }
  };
  const handleAttendanceUpdated = () => {
    // Refresh lesson data when attendance is updated
    fetchLesson();
  };
  const handleHomeworkSuccess = () => {
    // Refresh lesson data when homework is assigned
    fetchLesson();
    setIsHomeworkDialogOpen(false);
    toast.success('Homework assigned successfully!');
  };
  const handleEditSuccess = () => {
    // Refresh lesson data when lesson is updated
    fetchLesson();
    setIsEditDialogOpen(false);
    onLessonUpdated?.();
    toast.success('Lesson updated successfully!');
  };
  const handleDeleteLesson = async (deleteScope: DeleteScope) => {
    if (!lesson?.id) return;
    setIsDeleting(true);
    try {
      if (deleteScope === DeleteScope.THIS_LESSON_ONLY) {
        await lessonDeletionService.deleteSingleLesson(lesson.id);
      } else {
        await lessonDeletionService.deleteAllRecurringLessons(lesson.id);
      }
      setIsDeleteDialogOpen(false);
      onClose();
      onLessonUpdated?.();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  if (!lessonId) return null;

  // Filter out null student records to prevent crashes
  const validStudents = lesson?.lesson_students?.filter(enrollment => enrollment && enrollment.student && enrollment.student.id) || [];

  // Use demo session times if this is a demo session, otherwise use instance-specific or lesson dates
  const displayStartTime = demoSession ? demoSession.start_time : (instanceStart || lesson?.start_time);
  const displayEndTime = demoSession ? demoSession.end_time : (instanceEnd || lesson?.end_time);
  
  // Determine if this is a demo session
  const isDemoSession = Boolean(demoSessionId && demoSession);
  return <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isDemoSession ? `Demo Session: ${lesson?.title || 'Loading...'}` : (lesson?.title || 'Loading...')}
              {isDemoSession && <Badge variant="default" className="ml-2 bg-purple-600">
                  Demo Session
                </Badge>}
              {isRecurringInstance && !isDemoSession && <Badge variant="outline" className="ml-2">
                  Recurring Instance
                </Badge>}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div> : lesson ? <div className="space-y-6">
              {/* Lesson Progress Tracking - Only for teachers and not demo sessions */}
              {isTeacherRole && !isDemoSession && <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-4 w-4" />
                      Lesson Completion Progress
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          {attendanceStatus.allMarked ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-400" />}
                          <div>
                            <p className="font-medium text-sm">Mark Attendance</p>
                            <p className="text-xs text-muted-foreground">
                              {attendanceStatus.markedCount} of {attendanceStatus.totalStudents} students marked
                            </p>
                          </div>
                        </div>
                        <Badge variant={attendanceStatus.allMarked ? "default" : "secondary"}>
                          {attendanceStatus.allMarked ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          {homeworkStatus.exists ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-400" />}
                          <div>
                            <p className="font-medium text-sm">Set Homework</p>
                            <p className="text-xs text-muted-foreground">
                              {homeworkStatus.exists ? "Homework assigned" : "No homework assigned yet"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={homeworkStatus.exists ? "default" : "secondary"}>
                          {homeworkStatus.exists ? "Complete" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>}

              {/* Basic Information */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  {lesson.description && <p className="text-sm text-muted-foreground">{lesson.description}</p>}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {displayStartTime && typeof displayStartTime === 'string' && format(parseISO(displayStartTime), 'MMM d, yyyy h:mm a')}
                      {displayEndTime && typeof displayEndTime === 'string' && ` - ${format(parseISO(displayEndTime), 'h:mm a')}`}
                    </span>
                    {isRecurringInstance && instanceDate && typeof instanceDate === 'string' && <Badge variant="secondary" className="ml-2 text-xs">
                        Instance on {format(parseISO(instanceDate), 'MMM d, yyyy')}
                      </Badge>}
                  </div>

                  {isDemoSession && demoSession?.admin ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">
                        Demo Host: {demoSession.admin.first_name} {demoSession.admin.last_name}
                      </span>
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Admin</Badge>
                    </div>
                  ) : lesson.tutor && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Teacher: {lesson.tutor.first_name} {lesson.tutor.last_name}
                      </span>
                    </div>
                  )}

                  {lesson.subject && <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{lesson.subject}</Badge>
                      {isDemoSession && <Badge variant="outline" className="text-purple-600 border-purple-600">Trial Lesson</Badge>}
                    </div>}

                  {lesson.is_group && <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">Group Lesson</Badge>
                      {validStudents.length > 0 && <span className="text-sm text-muted-foreground">
                          ({validStudents.length} students)
                        </span>}
                    </div>}

                  {lesson.is_recurring}
                </CardContent>
              </Card>

              {/* Video Conference Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-4 w-4" />
                    <h3 className="font-medium">Video Conference</h3>
                    {isTeacherRole ? <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs ml-auto">
                        <Shield className="h-3 w-3" />
                        Host Access
                      </div> : <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs ml-auto">
                        <UserCheck className="h-3 w-3" />
                        Student Access
                      </div>}
                  </div>

                  {lesson.lesson_space_room_url || lesson.lesson_space_room_id ? <VideoConferenceLink lessonId={lesson.id} lessonSpaceRoomUrl={lesson.lesson_space_room_url} lessonSpaceRoomId={lesson.lesson_space_room_id} lessonSpaceSpaceId={lesson.lesson_space_space_id} isGroupLesson={lesson.is_group} studentCount={validStudents.length} /> : <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-700">
                          <p className="font-medium">No video room created yet</p>
                          <p>
                            {isTeacherRole ? 'Create a LessonSpace room to enable video conferencing for this lesson.' : 'Ask your teacher to create a video room for this lesson.'}
                          </p>
                        </div>
                      </div>
                      
                      {isTeacherRole && <Button onClick={handleCreateLessonSpaceRoom} disabled={isCreatingRoom} className="w-full">
                          {isCreatingRoom ? <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Room...
                            </> : <>
                              <Video className="h-4 w-4 mr-2" />
                              Create LessonSpace Room
                            </>}
                        </Button>}
                    </div>}
                </CardContent>
              </Card>

              {/* Students Section with Attendance - Only show if there are valid students */}
              {validStudents.length > 0 && <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Students ({validStudents.length})
                      {lesson.lesson_students && validStudents.length < lesson.lesson_students.length && <Badge variant="destructive" className="ml-2 text-xs">
                          {lesson.lesson_students.length - validStudents.length} missing data
                        </Badge>}
                    </h3>
                    <div className="space-y-3">
                      {validStudents.map((enrollment: any, index: number) => <StudentAttendanceRow key={enrollment.student?.id || index} student={enrollment.student} lessonId={lesson.id} lessonData={{
                  title: lesson.title,
                  start_time: displayStartTime,
                  tutor: lesson.tutor
                }} isStudent={!isTeacherRole} />)}
                    </div>
                  </CardContent>
                </Card>}

              {/* Show warning if there are students with missing data */}
              {lesson.lesson_students && validStudents.length < lesson.lesson_students.length && <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-700">
                        <p className="font-medium">Some student data is missing</p>
                        <p>
                          {lesson.lesson_students.length - validStudents.length} student record(s) could not be loaded. 
                          This may be due to data synchronization issues.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>}

              {/* Homework Section */}
              {homeworkStatus.exists && <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Assigned Homework
                    </h3>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        {homeworkStatus.homework?.title}
                      </p>
                      {homeworkStatus.homework?.description && <p className="text-sm text-green-700 mt-1">
                          {homeworkStatus.homework.description}
                        </p>}
                      {homeworkStatus.homework?.due_date && <p className="text-xs text-green-600 mt-2">
                          Due: {format(parseISO(homeworkStatus.homework.due_date), 'MMM d, yyyy')}
                        </p>}
                    </div>
                  </CardContent>
                </Card>}

              {/* AI Lesson Summaries Section - Only show if students exist and not a demo session */}
              {validStudents.length > 0 && !isDemoSession && (
                <StudentLessonSummary 
                  lessonId={lesson.id} 
                  students={validStudents} 
                />
              )}


              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  
                  {lesson.is_recurring}
                </div>
                
                <div className="flex gap-2">
                  {canEditLesson && <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Lesson
                    </Button>}
                  {canDeleteLesson && <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Lesson
                    </Button>}
                   {isTeacherRole && !isDemoSession && <Button variant="outline" onClick={() => setIsHomeworkDialogOpen(true)} className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {homeworkStatus.exists ? 'Edit Homework' : 'Set Homework'}
                    </Button>}
                    
                    {/* Process Lesson Button - Only for specific GCSE Maths lesson */}
                    {isTargetGCSELesson && (
                      <Button 
                        variant={isProcessed ? "default" : "outline"}
                        onClick={handleProcessLesson}
                        className={`flex items-center gap-2 ${isProcessed ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                      >
                        <Play className="h-4 w-4" />
                        Process Lesson
                      </Button>
                    )}
                  
                </div>
              </div>
            </div> : <div className="text-center p-8">
              <p className="text-muted-foreground">Failed to load lesson details</p>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      {canDeleteLesson && lesson && <DeleteLessonDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDeleteLesson} lessonTitle={lesson.title} isRecurring={lesson.is_recurring} isRecurringInstance={lesson.is_recurring_instance} lessonId={lesson.id} isLoading={isDeleting} />}

      {/* Edit Lesson Dialog - Only for admins/owners */}
      {canEditLesson && <EditLessonForm isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} onSuccess={handleEditSuccess} lessonId={lessonId} />}

      {/* Homework Assignment Dialog */}
      {isHomeworkDialogOpen && lesson && <AssignHomeworkDialog isOpen={isHomeworkDialogOpen} onClose={() => setIsHomeworkDialogOpen(false)} onSuccess={handleHomeworkSuccess} preSelectedLessonId={lesson.id} preloadedLessonData={lesson} editingHomework={homeworkStatus.homework ? {
      id: homeworkStatus.homework.id,
      title: homeworkStatus.homework.title,
      description: homeworkStatus.homework.description,
      lesson_id: homeworkStatus.homework.lesson_id,
      due_date: homeworkStatus.homework.due_date ? new Date(homeworkStatus.homework.due_date) : undefined,
      attachment_url: homeworkStatus.homework.attachment_url,
      attachment_type: homeworkStatus.homework.attachment_type
    } : undefined} />}
    </>;
};
export default LessonDetailsDialog;