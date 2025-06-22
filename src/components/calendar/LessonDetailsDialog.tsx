import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  User, 
  Users, 
  MapPin, 
  BookOpen, 
  Video, 
  Edit, 
  Trash2, 
  ExternalLink,
  Check,
  Plus,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lesson } from '@/types/lesson';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import { useExternalAgora } from '@/hooks/useExternalAgora';

interface LessonDetailsDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLessonUpdated?: () => void;
}

interface StudentAttendance {
  studentId: number;
  attendanceStatus: 'attended' | 'missed' | 'excused';
  feedback?: string;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({ 
  lessonId, 
  isOpen, 
  onClose,
  onLessonUpdated
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedIsGroup, setEditedIsGroup] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [skipHomeworkStep, setSkipHomeworkStep] = useState(false);
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [isAgoraLoading, setIsAgoraLoading] = useState(false);
  const { createExternalAgoraRoom } = useExternalAgora();

  useEffect(() => {
    if (lessonId && isOpen) {
      fetchLessonDetails(lessonId);
    }
  }, [lessonId, isOpen]);

  useEffect(() => {
    if (lesson) {
      setEditedTitle(lesson.title);
      setEditedDescription(lesson.description || '');
      setEditedSubject(lesson.subject || '');
      setEditedStartTime(format(parseISO(lesson.start_time), 'HH:mm'));
      setEditedEndTime(format(parseISO(lesson.end_time), 'HH:mm'));
      setEditedIsGroup(lesson.is_group);
      
      // Initialize student attendances from lesson data
      if (lesson.students) {
        const initialAttendances: StudentAttendance[] = lesson.students.map(student => ({
          studentId: student.id,
          attendanceStatus: (student.attendance_status as 'attended' | 'missed' | 'excused') || 'attended',
          feedback: student.feedback || '',
        }));
        setStudentAttendances(initialAttendances);
      }
    }
  }, [lesson]);

  const fetchLessonDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;

      // Transform the data to match our Lesson interface
      const students = lessonData.lesson_students.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name
      }));

      const processedStudents = students.map(student => {
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          attendance_status: 'attended',
          feedback: '',
        };
      });

      const lessonStudentsData = lessonData.lesson_students.map((ls: any) => ({
        student: {
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name
        }
      }));

      // Simplified lesson data without removed video conference properties
      const processedLesson: Lesson = {
        ...lessonData,
        lesson_type: (lessonData.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular',
        students: processedStudents,
        lesson_students: lessonStudentsData
      };

      setLesson(processedLesson);
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (!lessonId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: editedTitle,
          description: editedDescription,
          subject: editedSubject,
          start_time: format(parseISO(lesson.start_time), `yyyy-MM-dd'T'${editedStartTime}:00.000'Z'`),
          end_time: format(parseISO(lesson.end_time), `yyyy-MM-dd'T'${editedEndTime}:00.000'Z'`),
          is_group: editedIsGroup,
        })
        .eq('id', lessonId);

      if (error) throw error;

      // Refresh lesson details after successful update
      await fetchLessonDetails(lessonId);
      setIsEditing(false);
      toast.success('Lesson updated successfully');
      if (onLessonUpdated) {
        onLessonUpdated();
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!lessonId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      onClose(); // Close the dialog after successful deletion
      toast.success('Lesson deleted successfully');
      if (onLessonUpdated) {
        onLessonUpdated();
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = () => {
    setIsCompletingSession(true);
  };

  const handleCompleteSessionClose = () => {
    setIsCompletingSession(false);
  };

  const handleSessionCompleted = () => {
    setIsCompletingSession(false);
    onClose();
    if (onLessonUpdated) {
      onLessonUpdated();
    }
  };

  const handleCancelLesson = () => {
    setIsCancelling(true);
  };

  const handleRescheduleLesson = () => {
    setIsRescheduling(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!lessonId || !rescheduleDate || !rescheduleReason) return;

    setIsSubmittingReschedule(true);
    try {
      // Update lesson status and add reschedule reason
      const { error } = await supabase
        .from('lessons')
        .update({
          status: 'rescheduled',
          reschedule_date: rescheduleDate.toISOString(),
          reschedule_reason: rescheduleReason,
        })
        .eq('id', lessonId);

      if (error) throw error;

      // Refresh lesson details after successful reschedule
      await fetchLessonDetails(lessonId);
      setIsRescheduling(false);
      toast.success('Lesson rescheduled successfully');
      if (onLessonUpdated) {
        onLessonUpdated();
      }
    } catch (error) {
      console.error('Error rescheduling lesson:', error);
      toast.error('Failed to reschedule lesson');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleCancellationSubmit = async () => {
    if (!lessonId) return;

    setIsSubmittingCancellation(true);
    try {
      // Update lesson status to cancelled
      const { error } = await supabase
        .from('lessons')
        .update({
          status: 'cancelled',
        })
        .eq('id', lessonId);

      if (error) throw error;

      // Refresh lesson details after successful cancellation
      await fetchLessonDetails(lessonId);
      setIsCancelling(false);
      toast.success('Lesson cancelled successfully');
      if (onLessonUpdated) {
        onLessonUpdated();
      }
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      toast.error('Failed to cancel lesson');
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  const handleAttendanceChange = (studentId: number, status: 'attended' | 'missed' | 'excused') => {
    setStudentAttendances(prev => {
      const existingAttendance = prev.find(sa => sa.studentId === studentId);
      if (existingAttendance) {
        return prev.map(sa =>
          sa.studentId === studentId ? { ...sa, attendanceStatus: status } : sa
        );
      } else {
        return [...prev, { studentId, attendanceStatus: status }];
      }
    });
  };

  const handleFeedbackChange = (studentId: number, feedback: string) => {
    setStudentAttendances(prev => {
      return prev.map(sa =>
        sa.studentId === studentId ? { ...sa, feedback } : sa
      );
    });
  };

  const handleCreateAgoraRoom = async () => {
    if (!lesson || !lesson.id || !lesson.tutor_id) {
      toast.error('Lesson or tutor ID is missing');
      return;
    }

    setIsAgoraLoading(true);
    try {
      // Assuming the current user is the tutor
      await createExternalAgoraRoom(lesson.id, lesson.tutor_id, 'tutor');
      toast.success('Agora room created successfully!');
    } catch (error) {
      console.error('Error creating Agora room:', error);
      toast.error('Failed to create Agora room');
    } finally {
      setIsAgoraLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? 'Edit Lesson' : 'Lesson Details'}
          </DialogTitle>
          <DialogDescription>
            {lesson && (
              <>
                {format(parseISO(lesson.start_time), 'MMMM d, yyyy')}
                <br />
                {format(parseISO(lesson.start_time), 'h:mm a')} - {format(parseISO(lesson.end_time), 'h:mm a')}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            Loading lesson details...
          </div>
        ) : lesson ? (
          <div className="space-y-6">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      type="text"
                      id="title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      type="text"
                      id="subject"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={editedStartTime}
                      onChange={(e) => setEditedStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={editedEndTime}
                      onChange={(e) => setEditedEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="checkbox"
                    id="isGroup"
                    checked={editedIsGroup}
                    onChange={(e) => setEditedIsGroup(e.target.checked)}
                  />
                  <Label htmlFor="isGroup">Group Session</Label>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 opacity-70" />
                      <span className="text-sm font-medium">Date</span>
                    </div>
                    <p className="text-sm">{format(parseISO(lesson.start_time), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 opacity-70" />
                      <span className="text-sm font-medium">Time</span>
                    </div>
                    <p className="text-sm">
                      {format(parseISO(lesson.start_time), 'h:mm a')} - {format(parseISO(lesson.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 opacity-70" />
                      <span className="text-sm font-medium">Subject</span>
                    </div>
                    <p className="text-sm">{lesson.subject}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 opacity-70" />
                      <span className="text-sm font-medium">Tutor</span>
                    </div>
                    <p className="text-sm">{lesson.tutor?.first_name} {lesson.tutor?.last_name}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium">Description</span>
                  </div>
                  <p className="text-sm">{lesson.description || 'No description provided.'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium">Students</span>
                  </div>
                  {lesson.students && lesson.students.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {lesson.students.map((student) => (
                        <li key={student.id} className="text-sm">
                          {student.first_name} {student.last_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No students enrolled in this lesson.</p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Video Conference Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Video Conference</h3>
              {lesson.flexible_classroom_room_id ? (
                <>
                  <VideoConferenceLink 
                    flexibleClassroomRoomId={lesson.flexible_classroom_room_id}
                    flexibleClassroomSessionData={lesson.flexible_classroom_session_data}
                    isGroupLesson={lesson.is_group}
                    studentCount={lesson.students?.length || 0}
                    lessonId={lesson.id}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Join the video conference using the link above.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isAgoraLoading}
                      onClick={handleCreateAgoraRoom}
                    >
                      {isAgoraLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Room...
                        </>
                      ) : (
                        'Recreate Agora Room'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    No video conference room has been created for this lesson.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={isAgoraLoading}
                    onClick={handleCreateAgoraRoom}
                  >
                    {isAgoraLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Room...
                      </>
                    ) : (
                      'Create Agora Room'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Attendance and Feedback Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attendance & Feedback</h3>
              {lesson.students && lesson.students.length > 0 ? (
                <div className="space-y-2">
                  {lesson.students.map((student) => {
                    const attendance = studentAttendances.find(sa => sa.studentId === student.id);
                    const attendanceStatus = attendance ? attendance.attendanceStatus : 'attended';
                    const feedback = attendance ? attendance.feedback : '';

                    return (
                      <div key={student.id} className="border rounded-md p-4">
                        <h4 className="font-medium">{student.first_name} {student.last_name}</h4>
                        <div className="mt-2">
                          <RadioGroup defaultValue={attendanceStatus} onValueChange={(value) => handleAttendanceChange(student.id, value as 'attended' | 'missed' | 'excused')}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="attended" id={`attended-${student.id}`} className="peer h-4 w-4 border border-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                              <Label htmlFor={`attended-${student.id}`} className="cursor-pointer peer-checked:text-primary">Attended</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="missed" id={`missed-${student.id}`} className="peer h-4 w-4 border border-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                              <Label htmlFor={`missed-${student.id}`} className="cursor-pointer peer-checked:text-primary">Missed</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="excused" id={`excused-${student.id}`} className="peer h-4 w-4 border border-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                              <Label htmlFor={`excused-${student.id}`} className="cursor-pointer peer-checked:text-primary">Excused</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="mt-2">
                          <Label htmlFor={`feedback-${student.id}`}>Feedback</Label>
                          <Textarea
                            id={`feedback-${student.id}`}
                            placeholder="Enter feedback for this student..."
                            className="resize-none mt-1"
                            value={feedback || ''}
                            onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 inline-block" />
                  No students are enrolled in this lesson.
                </div>
              )}
            </div>

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveClick} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Close
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleEditClick} disabled={isLoading}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Lesson
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Lesson
                  </Button>
                  <Button type="button" onClick={handleCompleteSession} disabled={isLoading}>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Session
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        ) : (
          <div className="py-6 text-center">
            Error loading lesson details. Please try again.
          </div>
        )}
      </DialogContent>

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        lessonId={lessonId}
        isOpen={isCompletingSession}
        onClose={handleCompleteSessionClose}
        onSuccess={handleSessionCompleted}
        skipHomeworkStep={skipHomeworkStep}
      />

      {/* Cancel Lesson Confirmation Dialog */}
      <Dialog open={isCancelling} onOpenChange={() => setIsCancelling(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this lesson? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCancelling(false)} disabled={isSubmittingCancellation}>
              Go Back
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancellationSubmit} disabled={isSubmittingCancellation}>
              {isSubmittingCancellation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Lesson Dialog */}
      <Dialog open={isRescheduling} onOpenChange={() => setIsRescheduling(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Lesson</DialogTitle>
            <DialogDescription>
              Select a new date and provide a reason for rescheduling this lesson.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="rescheduleDate">New Date</Label>
              <Input
                type="date"
                id="rescheduleDate"
                value={rescheduleDate ? format(rescheduleDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setRescheduleDate(new Date(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rescheduleReason">Reason for Reschedule</Label>
              <Textarea
                id="rescheduleReason"
                placeholder="Briefly explain why this lesson is being rescheduled..."
                className="resize-none mt-1"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRescheduling(false)} disabled={isSubmittingReschedule}>
              Go Back
            </Button>
            <Button type="button" onClick={handleRescheduleSubmit} disabled={isSubmittingReschedule}>
              {isSubmittingReschedule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default LessonDetailsDialog;
