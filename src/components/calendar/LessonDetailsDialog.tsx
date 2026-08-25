import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Users, MapPin, Calendar, Video, Loader2, ExternalLink, AlertCircle, Shield, UserCheck, CheckCircle, Circle, BookOpen, Edit, Trash2, Play, Send, ClipboardCheck, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import StudentAttendanceRow from '@/components/lessons/StudentAttendanceRow';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import HomeworkCompletionCheckDialog from '@/components/homework/HomeworkCompletionCheckDialog';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import DeleteLessonDialog from '@/components/lessons/DeleteLessonDialog';
import StudentLessonSummary from './StudentLessonSummary';
import LessonPlanCard from './LessonPlanCard';
import TranscriptProposalDialog, { ProposalPrefill } from './TranscriptProposalDialog';
import { useHeyCleoHomeworkStatus } from '@/hooks/useHeyCleoHomeworkStatus';


import { DeleteScope, lessonDeletionService } from '@/services/lessonDeletionService';
interface LessonDetailsDialogProps {
  lessonId: string | null;
  
  isOpen: boolean;
  onClose: () => void;
  onLessonUpdated?: () => void;
  instanceDate?: string;
  instanceStart?: string;
  instanceEnd?: string;
}
const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lessonId,
  
  isOpen,
  onClose,
  onLessonUpdated,
  instanceDate,
  instanceStart,
  instanceEnd
}) => {
  const [lesson, setLesson] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [isCompletionCheckOpen, setIsCompletionCheckOpen] = useState(false);
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
  const [isTranscriptProposalOpen, setIsTranscriptProposalOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);

  const [assessmentTutors, setAssessmentTutors] = useState<any[]>([]);
  const [selectedAssessmentTutor, setSelectedAssessmentTutor] = useState<string>('');
  const [isAssigningAssessment, setIsAssigningAssessment] = useState(false);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [assessmentDueDate, setAssessmentDueDate] = useState<string>('');
  const [assessmentSearch, setAssessmentSearch] = useState<string>('');
  const [assessmentPopoverOpen, setAssessmentPopoverOpen] = useState<boolean>(false);

  const ASSESSMENT_ROOM_URL = 'https://www.thelessonspace.com/space/2670b244-b11f-4be3-8336-32bb2ce558e9';
  const ASSESSMENT_ROOM_ID = '2670b244-b11f-4be3-8336-32bb2ce558e9';

  const openAssessmentDialog = async () => {
    setSelectedAssessmentTutor('');
    setSelectedAssessmentId('');
    // Default due date to lesson end date (yyyy-mm-dd)
    try {
      const d = lesson?.end_time ? new Date(lesson.end_time) : new Date();
      setAssessmentDueDate(d.toISOString().slice(0, 10));
    } catch {
      setAssessmentDueDate('');
    }
    setIsAssessmentDialogOpen(true);
    try {
      const [tutorsRes, assessmentsRes] = await Promise.all([
        supabase
          .from('tutors')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('first_name'),
        supabase
          .from('ai_assessments')
          .select('id, title, subject, exam_board, year')
          .eq('status', 'published')
          .order('title'),
      ]);
      if (tutorsRes.error) throw tutorsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      setAssessmentTutors(tutorsRes.data || []);
      setAssessmentsList(assessmentsRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tutors or assessments');
    }
  };

  const handleAssignAssessmentWeek = async () => {
    if (!lesson?.id || !selectedAssessmentTutor || !selectedAssessmentId) return;
    setIsAssigningAssessment(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          tutor_id: selectedAssessmentTutor,
          lesson_space_room_url: ASSESSMENT_ROOM_URL,
          lesson_space_room_id: ASSESSMENT_ROOM_ID,
          lesson_space_space_id: ASSESSMENT_ROOM_ID,
          video_conference_link: ASSESSMENT_ROOM_URL,
          video_conference_provider: 'lessonspace',
        })
        .eq('id', lesson.id);
      if (error) throw error;

      const { error: participantUrlError } = await supabase
        .from('lesson_participant_urls')
        .delete()
        .eq('lesson_id', lesson.id);
      if (participantUrlError) throw participantUrlError;

      // Pre-generate participant URLs pointing at the shared assessment room
      const tutor = assessmentTutors.find(t => t.id === selectedAssessmentTutor);
      const tutorName = tutor
        ? `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() || 'Tutor'
        : 'Tutor';

      const { data: enrolled, error: enrolledError } = await supabase
        .from('lesson_students')
        .select('student:students(id, user_id, first_name, last_name, parent:parents(user_id))')
        .eq('lesson_id', lesson.id);
      if (enrolledError) throw enrolledError;

      const rows: Array<{
        lesson_id: string;
        participant_id: string;
        participant_type: 'tutor' | 'student';
        participant_name: string;
        launch_url: string;
      }> = [
        {
          lesson_id: lesson.id,
          participant_id: selectedAssessmentTutor,
          participant_type: 'tutor',
          participant_name: tutorName,
          launch_url: ASSESSMENT_ROOM_URL,
        },
      ];

      for (const row of enrolled || []) {
        const s: any = (row as any).student;
        if (!s?.id) continue;
        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
        rows.push({
          lesson_id: lesson.id,
          participant_id: String(s.id),
          participant_type: 'student',
          participant_name: name,
          launch_url: ASSESSMENT_ROOM_URL,
        });
      }

      const { error: insertUrlError } = await supabase
        .from('lesson_participant_urls')
        .insert(rows);
      if (insertUrlError) throw insertUrlError;

      // Assign the selected assessment to every enrolled student — fallback to parent account
      const studentList = (enrolled || [])
        .map((r: any) => r.student)
        .filter((s: any) => s?.id);

      const resolved = studentList
        .map((s: any) => ({
          student: s,
          targetUserId: s.user_id || s.parent?.user_id || null,
          viaParent: !s.user_id && !!s.parent?.user_id,
        }))
        .filter((r) => !!r.targetUserId);
      const skipped = studentList.length - resolved.length;

      // Dedupe by target user id (parents with multiple kids in group)
      const uniqueByUser = new Map<string, typeof resolved[number]>();
      for (const r of resolved) {
        if (!uniqueByUser.has(r.targetUserId!)) uniqueByUser.set(r.targetUserId!, r);
      }
      const uniqueTargets = Array.from(uniqueByUser.values());

      let assignedCount = 0;
      if (uniqueTargets.length > 0) {
        const { data: authData } = await supabase.auth.getUser();
        const assignedBy = authData?.user?.id;
        const dueDateIso = assessmentDueDate ? new Date(assessmentDueDate).toISOString() : null;

        const userIds = uniqueTargets.map((r) => r.targetUserId as string);
        const { data: existing } = await supabase
          .from('assessment_assignments')
          .select('assigned_to')
          .eq('assessment_id', selectedAssessmentId)
          .in('assigned_to', userIds);
        const existingIds = new Set((existing || []).map((r: any) => r.assigned_to));

        const toInsert = uniqueTargets
          .filter((r) => !existingIds.has(r.targetUserId as string))
          .map((r) => ({
            assessment_id: selectedAssessmentId,
            assigned_to: r.targetUserId as string,
            assigned_by: assignedBy,
            due_date: dueDateIso,
            status: 'assigned' as const,
            notes: `Assigned via Assessment Week for ${lesson.title || 'lesson'}${r.viaParent ? ' (sent to parent account)' : ''}`,
          }));

        if (toInsert.length > 0) {
          const { error: assignError } = await supabase
            .from('assessment_assignments')
            .insert(toInsert);
          if (assignError) throw assignError;
        }
        assignedCount = toInsert.length;
      }

      toast.success(
        `Assessment week assigned — sent to ${resolved.length} of ${studentList.length} student${studentList.length === 1 ? '' : 's'} (via parent where needed)`
      );
      if (skipped > 0) {
        toast.message(`${skipped} student${skipped === 1 ? '' : 's'} skipped (no student or parent account linked)`);
      }


      setIsAssessmentDialogOpen(false);
      onLessonUpdated?.();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to assign assessment week');
    } finally {
      setIsAssigningAssessment(false);
    }
  };

  const navigate = useNavigate();
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
  
  // Check if this is the specific GCSE lesson for demo button
  const isTargetGCSELesson = lesson?.id === '1c3a8bed-ac82-45f9-8ce9-9fc336abcdf8' && 
    lesson?.subject === 'Year 11 Maths Highier' && 
    lesson?.title === 'GCSE Biology';
  
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
      fetchLesson();
    }
  }, [lessonId, isOpen]);

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
            student:students(id, first_name, last_name, email, phone)
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
      const { data: homeworkList } = await supabase
        .from('homework')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const homework = homeworkList?.[0] || null;
      setHomeworkStatus({
        exists: !!homework,
        homework: homework
      });
    } catch (error) {
      console.error('Error checking homework status:', error);
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
      } else if (deleteScope === DeleteScope.DELETE_FROM_DATE_ONWARDS) {
        await lessonDeletionService.deleteFromDateOnwards(lesson.id);
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
  // Filter out null student records to prevent crashes
  const validStudents = lesson?.lesson_students?.filter(enrollment => enrollment && enrollment.student && enrollment.student.id) || [];

  // Last week's HeyCleo homework completion for these students
  const { statuses: homeworkStatuses, links: homeworkLinks, summary: homeworkSummary } = useHeyCleoHomeworkStatus(
    validStudents.map((e: any) => e.student?.id).filter((id: any) => typeof id === 'number')
  );

  if (!lessonId) return null;


  const buildFallbackPrefill = (): ProposalPrefill => {
    const student = validStudents[0]?.student;
    return {
      recipientName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
      recipientEmail: student?.email || '',
      recipientPhone: student?.phone || '',
      lessonType: '',
      subject: lesson?.subject || '',
      pricePerLesson: 45,
      paymentCycle: '',
      contractTerm: 'month_to_month',
      lessonTimes: [],
    };
  };


  // Use instance-specific times for recurring instances, otherwise use lesson dates
  const displayStartTime = instanceStart || lesson?.start_time;
  const displayEndTime = instanceEnd || lesson?.end_time;
  
  // Determine if this is a demo session
  
  return <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {lesson?.title || 'Loading...'}
              {isRecurringInstance && <Badge variant="outline" className="ml-2">
                  Recurring Instance
                </Badge>}
            </DialogTitle>
          </DialogHeader>

          {(isAdmin || isOwner) && lesson && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                onClick={openAssessmentDialog}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Assessment Week
              </Button>
            </div>
          )}

          {isLoading ? <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div> : lesson ? <div className="space-y-6">
              {/* Lesson Progress Tracking - Only for teachers and not demo sessions */}
              {isTeacherRole && <Card className="border-blue-200 bg-blue-50/50">
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

              {/* Lesson Plan for this week */}
              <LessonPlanCard
                subject={lesson.subject}
                startTime={typeof displayStartTime === 'string' ? displayStartTime : undefined}
                canManagePlans={isTeacherRole}
              />



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
                    {isRecurringInstance && <Badge variant="secondary" className="ml-2 text-xs">
                        Recurring Instance
                      </Badge>}
                  </div>

                  {lesson.tutor && (
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

                  {lesson.lesson_space_room_url || lesson.lesson_space_room_id ? <VideoConferenceLink lessonId={lesson.id} lessonSpaceRoomUrl={lesson.lesson_space_room_url} lessonSpaceRoomId={lesson.lesson_space_room_id} lessonSpaceSpaceId={lesson.lesson_space_space_id} lessonTitle={lesson.title} lessonSubject={lesson.subject} isGroupLesson={lesson.is_group} studentCount={validStudents.length} hasHomework={homeworkStatus.exists} homeworkId={homeworkStatus.homework?.id} /> : <div className="space-y-3">
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
                    {homeworkSummary && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {homeworkSummary.completed} of {homeworkSummary.total} completed last week's homework
                      </p>
                    )}
                    <div className="space-y-3">
                      {validStudents.map((enrollment: any, index: number) => <StudentAttendanceRow key={enrollment.student?.id || index} student={enrollment.student} lessonId={lesson.id} homeworkStatus={homeworkStatuses[enrollment.student?.id]} heycleoStudentId={homeworkLinks[enrollment.student?.id]} lessonData={{
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
              {validStudents.length > 0 && (
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
                   {isTeacherRole && <Button variant="outline" onClick={() => {
                      if (homeworkStatus.exists) {
                        // Edit existing homework — go straight to dialog
                        setIsHomeworkDialogOpen(true);
                      } else {
                        // New homework — show completion check first
                        setIsCompletionCheckOpen(true);
                      }
                    }} className="flex items-center gap-2">
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

                    {/* Send Proposal Button - demo & trial lessons, admin/owner only */}
                    {(lesson.lesson_type === 'demo' || lesson.lesson_type === 'trial') && canEditLesson && (
                      <Button
                        variant="outline"
                        onClick={() => setIsTranscriptProposalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send Proposal
                      </Button>
                    )}

                  
                </div>
              </div>
            </div> : <div className="text-center p-8">
              <p className="text-muted-foreground">Failed to load lesson details</p>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Draft Proposal from Transcript */}
      {isTranscriptProposalOpen && lesson && (
        <TranscriptProposalDialog
          isOpen={isTranscriptProposalOpen}
          onClose={() => setIsTranscriptProposalOpen(false)}
          lessonId={lesson.id}
          lessonSubject={lesson.subject}
          lessonType={lesson.lesson_type}
          fallbackPrefill={buildFallbackPrefill()}
          onUseDraft={(prefill) => {
            setIsTranscriptProposalOpen(false);
            onClose();
            navigate('/admin/proposals/create', { state: { proposalPrefill: prefill } });
          }}
          onSkip={() => {
            setIsTranscriptProposalOpen(false);
            onClose();
            navigate('/admin/proposals/create', { state: { proposalPrefill: buildFallbackPrefill() } });
          }}
        />
      )}


      {/* Delete Lesson Dialog */}
      {canDeleteLesson && lesson && <DeleteLessonDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDeleteLesson} lessonTitle={lesson.title} isRecurring={lesson.is_recurring} isRecurringInstance={lesson.is_recurring_instance} lessonId={lesson.id} isLoading={isDeleting} />}

      {/* Edit Lesson Dialog - Only for admins/owners */}
      {canEditLesson && <EditLessonForm isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} onSuccess={handleEditSuccess} lessonId={lessonId} />}

      {/* Homework Completion Check Dialog */}
      {isCompletionCheckOpen && lesson && (
        <HomeworkCompletionCheckDialog
          isOpen={isCompletionCheckOpen}
          onClose={() => setIsCompletionCheckOpen(false)}
          onComplete={() => {
            setIsCompletionCheckOpen(false);
            setIsHomeworkDialogOpen(true);
          }}
          lessonId={lesson.id}
          students={validStudents.map((e: any) => e.student).filter(Boolean)}
        />
      )}

      {/* Homework Assignment Dialog */}
      {isHomeworkDialogOpen && lesson && <AssignHomeworkDialog isOpen={isHomeworkDialogOpen} onClose={() => setIsHomeworkDialogOpen(false)} onSuccess={handleHomeworkSuccess} preSelectedLessonId={lesson.id} preloadedLessonData={lesson} editingHomework={homeworkStatus.homework ? {
      id: homeworkStatus.homework.id,
      title: homeworkStatus.homework.title,
      description: homeworkStatus.homework.description,
      lesson_id: homeworkStatus.homework.lesson_id,
      due_date: homeworkStatus.homework.due_date ? new Date(homeworkStatus.homework.due_date) : undefined,
      attachment_url: homeworkStatus.homework.attachment_url,
      attachment_type: homeworkStatus.homework.attachment_type,
      additional_resources_required: (homeworkStatus.homework as any).additional_resources_required || false,
      additional_resources_url: (homeworkStatus.homework as any).additional_resources_url || undefined,
      additional_resources_type: (homeworkStatus.homework as any).additional_resources_type || undefined,
    } : undefined} />}

      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Assign Assessment Week
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reassign the lesson to the assessment tutor, swap the video link to the shared assessment room, and assign an assessment to every enrolled student. Time conflicts are ignored.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tutor</label>
              <Select value={selectedAssessmentTutor} onValueChange={setSelectedAssessmentTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTutors.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assessment</label>
              <Popover open={assessmentPopoverOpen} onOpenChange={setAssessmentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assessmentPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {(() => {
                      const sel = assessmentsList.find((a) => a.id === selectedAssessmentId);
                      return sel ? sel.title : 'Select an assessment';
                    })()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search assessments..." />
                    <CommandList className="max-h-72">
                      <CommandEmpty>No assessments found.</CommandEmpty>
                      <CommandGroup>
                        {assessmentsList.map((a) => {
                          const subtitle = [a.subject, a.exam_board, a.year].filter(Boolean).join(' • ');
                          const value = [a.title, a.subject, a.exam_board, a.year].filter(Boolean).join(' ');
                          return (
                            <CommandItem
                              key={a.id}
                              value={value}
                              onSelect={() => {
                                setSelectedAssessmentId(a.id);
                                setAssessmentPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedAssessmentId === a.id ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <div className="flex flex-col">
                                <span>{a.title}</span>
                                {subtitle && (
                                  <span className="text-xs text-muted-foreground">{subtitle}</span>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>


            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due date (optional)</label>
              <input
                type="date"
                value={assessmentDueDate}
                onChange={(e) => setAssessmentDueDate(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssessmentDialogOpen(false)} disabled={isAssigningAssessment}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignAssessmentWeek}
                disabled={!selectedAssessmentTutor || !selectedAssessmentId || isAssigningAssessment}
              >
                {isAssigningAssessment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>;
};
export default LessonDetailsDialog;