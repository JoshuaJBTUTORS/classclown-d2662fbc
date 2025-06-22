
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  Video,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';

interface LessonDetailsDialogProps {
  lesson: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lesson,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

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
        onUpdate?.();
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

  if (!lesson) return null;

  const startTime = lesson.start_time ? parseISO(lesson.start_time) : null;
  const endTime = lesson.end_time ? parseISO(lesson.end_time) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {lesson.title}
          </DialogTitle>
        </DialogHeader>

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
                  {startTime && format(startTime, 'MMM d, yyyy h:mm a')}
                  {endTime && ` - ${format(endTime, 'h:mm a')}`}
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
              </div>

              {lesson.lesson_space_room_url ? (
                <VideoConferenceLink 
                  lessonSpaceRoomUrl={lesson.lesson_space_room_url}
                  lessonSpaceRoomId={lesson.lesson_space_room_id}
                  isGroupLesson={lesson.is_group}
                  studentCount={lesson.lesson_students?.length || 0}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">No video room created yet</p>
                      <p>Create a LessonSpace room to enable video conferencing for this lesson.</p>
                    </div>
                  </div>
                  
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Section */}
          {lesson.lesson_students && lesson.lesson_students.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({lesson.lesson_students.length})
                </h3>
                <div className="space-y-2">
                  {lesson.lesson_students.map((enrollment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {enrollment.student?.first_name} {enrollment.student?.last_name}
                      </span>
                      {enrollment.student?.email && (
                        <span className="text-xs text-muted-foreground">
                          {enrollment.student.email}
                        </span>
                      )}
                    </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
