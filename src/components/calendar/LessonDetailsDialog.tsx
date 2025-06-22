
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  Video,
  Loader2,
  ExternalLink,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import StudentAttendanceRow from '@/components/lessons/StudentAttendanceRow';

interface LessonDetailsDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLessonUpdated?: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lessonId,
  isOpen,
  onClose,
  onLessonUpdated
}) => {
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  useEffect(() => {
    if (lessonId && isOpen) {
      fetchLesson();
    }
  }, [lessonId, isOpen]);

  const fetchLesson = async () => {
    if (!lessonId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, email)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      setLesson(data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLessonSpaceRoom = async () => {
    if (!lesson?.id) return;

    setIsCreatingRoom(true);
    try {
      console.log('Creating LessonSpace room for lesson:', lesson.id);

      const { data, error } = await supabase.functions.invoke('lesson-space-integration', {
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

  if (!lessonId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {lesson?.title || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : lesson ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {lesson.description && (
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {lesson.start_time && format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')}
                    {lesson.end_time && ` - ${format(parseISO(lesson.end_time), 'h:mm a')}`}
                  </span>
                </div>

                {lesson.tutor && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Teacher: {lesson.tutor.first_name} {lesson.tutor.last_name}
                    </span>
                  </div>
                )}

                {lesson.subject && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{lesson.subject}</Badge>
                  </div>
                )}

                {lesson.is_group && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Group Lesson</Badge>
                    {lesson.lesson_students?.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({lesson.lesson_students.length} students)
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Conference Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="h-4 w-4" />
                  <h3 className="font-medium">Video Conference</h3>
                  {isTeacherRole ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs ml-auto">
                      <Shield className="h-3 w-3" />
                      Host Access
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs ml-auto">
                      <UserCheck className="h-3 w-3" />
                      Student Access
                    </div>
                  )}
                </div>

                {lesson.lesson_space_room_url || lesson.lesson_space_room_id ? (
                  <VideoConferenceLink 
                    lessonId={lesson.id}
                    lessonSpaceRoomUrl={lesson.lesson_space_room_url}
                    lessonSpaceRoomId={lesson.lesson_space_room_id}
                    lessonSpaceSpaceId={lesson.lesson_space_space_id}
                    isGroupLesson={lesson.is_group}
                    studentCount={lesson.lesson_students?.length || 0}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-700">
                        <p className="font-medium">No video room created yet</p>
                        <p>
                          {isTeacherRole 
                            ? 'Create a LessonSpace room to enable video conferencing for this lesson.'
                            : 'Ask your teacher to create a video room for this lesson.'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {isTeacherRole && (
                      <Button
                        onClick={handleCreateLessonSpaceRoom}
                        disabled={isCreatingRoom}
                        className="w-full"
                      >
                        {isCreatingRoom ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Room...
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Create LessonSpace Room
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students Section with Attendance */}
            {lesson.lesson_students && lesson.lesson_students.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Students ({lesson.lesson_students.length})
                  </h3>
                  <div className="space-y-3">
                    {lesson.lesson_students.map((enrollment: any, index: number) => (
                      <StudentAttendanceRow
                        key={enrollment.student?.id || index}
                        student={enrollment.student}
                        lessonId={lesson.id}
                        lessonData={{
                          title: lesson.title,
                          start_time: lesson.start_time,
                          tutor: lesson.tutor
                        }}
                        isStudent={!isTeacherRole}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'}>
                  {lesson.status || 'scheduled'}
                </Badge>
                {lesson.is_recurring && (
                  <Badge variant="outline">Recurring</Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Failed to load lesson details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
