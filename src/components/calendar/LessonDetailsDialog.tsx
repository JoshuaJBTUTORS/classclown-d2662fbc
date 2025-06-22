import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Users, Video, MapPin, Edit, Trash2, UserCheck, BookOpen, Plus, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lesson } from '@/types/lesson';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import VideoProviderSelector from '@/components/lessons/VideoProviderSelector';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import { useLessonSpace } from '@/hooks/useLessonSpace';
import { useAgora } from '@/hooks/useAgora';
import { useExternalAgora } from '@/hooks/useExternalAgora';
import { useFlexibleClassroom } from '@/hooks/useFlexibleClassroom';

interface LessonDetailsDialogProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lesson,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [tutor, setTutor] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Video conference hooks
  const { createRoom: createLessonSpaceRoom, isCreatingRoom: isCreatingLessonSpace } = useLessonSpace();
  const { createVideoRoom: createAgoraRoom, isCreating: isCreatingAgora } = useAgora();
  const { createExternalRoom, isCreating: isCreatingExternal } = useExternalAgora();
  const { createClassroomSession, isLoading: isCreatingFlexible } = useFlexibleClassroom();

  // Fetch lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lesson) return;

      try {
        // Fetch students
        const { data: lessonStudents, error: studentsError } = await supabase
          .from('lesson_students')
          .select('student_id, students(id, first_name, last_name, email)')
          .eq('lesson_id', lesson.id);

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
        } else {
          const studentData = lessonStudents?.map(ls => ls.students).filter(Boolean) || [];
          setStudents(studentData);
        }

        // Fetch tutor
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select('*')
          .eq('id', lesson.tutor_id)
          .single();

        if (tutorError) {
          console.error('Error fetching tutor:', tutorError);
        } else {
          setTutor(tutorData);
        }

        // Fetch homework
        fetchHomework();
      } catch (error) {
        console.error('Error fetching lesson data:', error);
      }
    };

    if (isOpen && lesson) {
      fetchLessonData();
    }
  }, [lesson, isOpen]);

  const fetchHomework = async () => {
    if (!lesson) return;

    try {
      const { data: homeworkData, error } = await supabase
        .from('homework')
        .select('*')
        .eq('lesson_id', lesson.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching homework:', error);
      } else {
        setHomework(homeworkData || []);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
    }
  };

  const handleCreateVideoRoom = async (provider: 'lesson_space' | 'agora' | 'external_agora' | 'flexible_classroom') => {
    if (!lesson) return;

    try {
      setLoading(true);
      let success = false;
      let updateData: any = {};

      switch (provider) {
        case 'lesson_space':
          const duration = Math.ceil((new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / (1000 * 60));
          const lessonSpaceResult = await createLessonSpaceRoom({
            lessonId: lesson.id,
            title: lesson.title,
            startTime: lesson.start_time,
            duration: duration
          });
          
          if (lessonSpaceResult) {
            updateData = {
              video_conference_provider: 'lesson_space',
              lesson_space_room_id: lessonSpaceResult.roomId,
              lesson_space_room_url: lessonSpaceResult.roomUrl,
              lesson_space_space_id: lessonSpaceResult.spaceId
            };
            success = true;
          }
          break;

        case 'agora':
          const agoraResult = await createAgoraRoom(lesson.id);
          if (agoraResult) {
            updateData = {
              video_conference_provider: 'agora',
              agora_channel_name: agoraResult.channelName,
              agora_token: agoraResult.token,
              agora_rtm_token: agoraResult.rtmToken,
              agora_uid: agoraResult.uid,
              netless_room_uuid: agoraResult.whiteboardRoomUuid,
              netless_room_token: agoraResult.whiteboardRoomToken
            };
            success = true;
          }
          break;

        case 'external_agora':
          const externalResult = await createExternalRoom(lesson.id);
          if (externalResult) {
            updateData = {
              video_conference_provider: 'external_agora',
              video_conference_link: externalResult.joinUrl
            };
            success = true;
          }
          break;

        case 'flexible_classroom':
          console.log('Creating Flexible Classroom session for lesson:', lesson.id);
          
          // Get the tutor's role for the session
          const userRole = 'tutor'; // This would come from auth context in real scenario
          
          // Create the classroom session
          const flexibleResult = await createClassroomSession(
            lesson.id,
            userRole,
            undefined, // Let the system generate UID
            tutor?.first_name + ' ' + tutor?.last_name
          );
          
          if (flexibleResult) {
            console.log('Flexible Classroom session created:', flexibleResult);
            
            updateData = {
              video_conference_provider: 'flexible_classroom',
              agora_channel_name: flexibleResult.roomId, // Store room ID in channel name field
              agora_token: JSON.stringify(flexibleResult), // Store full credentials as JSON
              agora_rtm_token: flexibleResult.rtmToken
            };
            success = true;
            toast.success('Flexible Classroom created successfully!');
          } else {
            toast.error('Failed to create Flexible Classroom session');
          }
          break;
      }

      if (success) {
        const { error } = await supabase
          .from('lessons')
          .update(updateData)
          .eq('id', lesson.id);

        if (error) {
          console.error('Error updating lesson:', error);
          toast.error('Failed to save room details');
        } else {
          toast.success(`${provider.replace('_', ' ').toUpperCase()} room created successfully!`);
          onRefresh?.();
        }
      }
    } catch (error) {
      console.error('Error creating video room:', error);
      toast.error('Failed to create video room');
    } finally {
      setLoading(false);
      setIsProviderSelectorOpen(false);
    }
  };

  if (!lesson) return null;

  const isGroupLesson = students.length > 1;
  const lessonDate = new Date(lesson.start_time);
  const endDate = new Date(lesson.end_time);
  const isCompleted = lesson.status === 'completed';
  const hasVideoRoom = lesson.video_conference_provider && (
    lesson.lesson_space_room_url || 
    lesson.agora_channel_name || 
    lesson.video_conference_link
  );

  const isCreatingRoom = isCreatingLessonSpace || isCreatingAgora || isCreatingExternal || isCreatingFlexible;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {lesson.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(lessonDate, 'EEEE, MMMM d, yyyy')} • {format(lessonDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </span>
                </div>
                
                {lesson.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{lesson.subject}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Tutor: {tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Loading...'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isGroupLesson ? `Group Lesson (${students.length} students)` : '1-on-1 Lesson'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={lesson.status === 'completed' ? 'default' : lesson.status === 'scheduled' ? 'secondary' : 'destructive'}>
                    {lesson.status}
                  </Badge>
                </div>

                {lesson.description && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students */}
            {students.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{student.first_name} {student.last_name}</span>
                        {student.email && (
                          <span className="text-sm text-muted-foreground">{student.email}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Conference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Online Meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasVideoRoom ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{lesson.video_conference_provider?.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <VideoConferenceLink 
                      lesson={lesson} 
                      userRole="tutor"
                      students={students}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No online room created yet</p>
                    <Button 
                      onClick={() => setIsProviderSelectorOpen(true)}
                      disabled={isCreatingRoom || loading}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Online Room
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Homework */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Homework</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHomeworkDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homework.length > 0 ? (
                  <div className="space-y-2">
                    {homework.map((hw) => (
                      <div key={hw.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{hw.title}</p>
                          {hw.due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(hw.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No homework assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              {!isCompleted && (
                <Button onClick={() => setIsCompleteDialogOpen(true)} variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Complete Session
                </Button>
              )}
              
              {onDelete && (
                <Button onClick={onDelete} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditLessonForm
        lesson={lesson}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          onRefresh?.();
        }}
      />

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        lesson={lesson}
        students={students}
        isOpen={isCompleteDialogOpen}
        onClose={() => setIsCompleteDialogOpen(false)}
        onSuccess={() => {
          setIsCompleteDialogOpen(false);
          onRefresh?.();
        }}
      />

      {/* Homework Dialog */}
      <AssignHomeworkDialog
        lessonId={lesson.id}
        isOpen={isHomeworkDialogOpen}
        onClose={() => setIsHomeworkDialogOpen(false)}
        onSuccess={() => {
          setIsHomeworkDialogOpen(false);
          // Refresh homework list
          fetchHomework();
        }}
      />

      {/* Video Provider Selector */}
      <VideoProviderSelector
        isOpen={isProviderSelectorOpen}
        onClose={() => setIsProviderSelectorOpen(false)}
        onSelectProvider={handleCreateVideoRoom}
        isCreating={isCreatingRoom || loading}
        isGroupLesson={isGroupLesson}
        studentCount={students.length}
      />
    </>
  );
};

export default LessonDetailsDialog;
