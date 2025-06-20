import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  BookOpen, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  FileText,
  Video
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Lesson } from '@/types/lesson';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import ViewHomeworkDialog from '@/components/homework/ViewHomeworkDialog';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LessonDetailsDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({ 
  lessonId, 
  isOpen, 
  onClose 
}) => {
  const { userRole } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [isViewHomeworkOpen, setIsViewHomeworkOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (lessonId && isOpen) {
      fetchLessonDetails();
    }
  }, [lessonId, isOpen, refreshKey]);

  const fetchLessonDetails = async () => {
    if (!lessonId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name, email),
          lesson_students!inner(
            student:students(id, first_name, last_name, email)
          ),
          homework(id, title, description, due_date, attachment_url, attachment_type)
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      // Transform the data to match our Lesson type
      const transformedLesson: Lesson = {
        ...data,
        students: data.lesson_students.map((ls: any) => ls.student),
        homework: data.homework?.[0] || null,
        lesson_students: data.lesson_students,
        lesson_type: (data.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular'
      };

      setLesson(transformedLesson);
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = async () => {
    if (!lesson) return;
    
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lesson.id);

        if (error) throw error;

        toast.success('Lesson deleted successfully');
        onClose();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        toast.error('Failed to delete lesson');
      }
    }
  };

  const handleCompleteLesson = () => {
    setIsCompleteDialogOpen(true);
  };

  if (!isOpen || !lessonId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!lesson) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Lesson not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canEdit = userRole === 'admin' || userRole === 'owner' || userRole === 'tutor';
  const canComplete = canEdit && lesson.status === 'scheduled';
  const canAssignHomework = canEdit;

  // Map userRole to the expected type for VideoConferenceLink
  const videoConferenceUserRole = (userRole === 'parent') ? 'student' : userRole as 'tutor' | 'student' | 'admin' | 'owner';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {lesson.title}
              </DialogTitle>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Lesson
                    </DropdownMenuItem>
                    {canComplete && (
                      <DropdownMenuItem onClick={handleCompleteLesson}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Lesson
                      </DropdownMenuItem>
                    )}
                    {canAssignHomework && (
                      <DropdownMenuItem onClick={() => setIsHomeworkDialogOpen(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Assign Homework
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Lesson
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  lesson.status === 'scheduled' ? 'outline' :
                  lesson.status === 'completed' ? 'default' :
                  'destructive'
                }
                className={lesson.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
              >
                {lesson.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                {lesson.status === 'cancelled' && <XCircle className="mr-1 h-3 w-3" />}
                {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
              </Badge>
              
              <Badge variant="secondary">
                {lesson.is_group ? 'Group Lesson' : 'Individual Lesson'}
              </Badge>

              {lesson.lesson_type === 'trial' && (
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  Trial Lesson
                </Badge>
              )}
            </div>

            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(parseISO(lesson.start_time), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(parseISO(lesson.start_time), 'h:mm a')} - 
                    {format(parseISO(lesson.end_time), 'h:mm a')}
                  </span>
                </div>

                {lesson.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lesson.subject}</span>
                  </div>
                )}

                {lesson.description && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Conference Link */}
            {(lesson.video_conference_link || lesson.agora_channel_name) && (
              <VideoConferenceLink 
                link={lesson.video_conference_link}
                provider={lesson.video_conference_provider}
                userRole={videoConferenceUserRole}
                isGroupLesson={lesson.is_group}
                studentCount={lesson.students?.length || 0}
                lessonId={lesson.id}
                hasLessonSpace={!!lesson.lesson_space_space_id}
                spaceId={lesson.lesson_space_space_id}
                hasAgora={!!lesson.agora_channel_name}
                agoraChannelName={lesson.agora_channel_name}
                agoraToken={lesson.agora_token}
                agoraUid={lesson.agora_uid}
                className="mb-4"
              />
            )}

            {/* Tutor Information */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tutor</span>
                </div>
                <p className="text-sm">
                  {lesson.tutor?.first_name} {lesson.tutor?.last_name}
                </p>
                {lesson.tutor?.email && (
                  <p className="text-sm text-muted-foreground">{lesson.tutor.email}</p>
                )}
              </CardContent>
            </Card>

            {/* Students Information */}
            {lesson.students && lesson.students.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Students ({lesson.students.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lesson.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          {student.email && (
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Homework Section */}
            {lesson.homework && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Homework Assigned</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsViewHomeworkOpen(true)}
                    >
                      View Details
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lesson.homework.title}</p>
                    {lesson.homework.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {format(parseISO(lesson.homework.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <EditLessonForm
        lessonId={lesson.id}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setIsEditDialogOpen(false);
          toast.success('Lesson updated successfully');
        }}
      />

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        lessonId={lesson.id}
        isOpen={isCompleteDialogOpen}
        onClose={() => setIsCompleteDialogOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setIsCompleteDialogOpen(false);
          toast.success('Lesson completed successfully');
        }}
      />

      {/* Assign Homework Dialog */}
      <AssignHomeworkDialog
        isOpen={isHomeworkDialogOpen}
        onClose={() => setIsHomeworkDialogOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setIsHomeworkDialogOpen(false);
          toast.success('Homework assigned successfully');
        }}
      />

      {/* View Homework Dialog */}
      {lesson.homework && (
        <ViewHomeworkDialog
          homeworkId={lesson.homework.id}
          submissionId={null}
          isOpen={isViewHomeworkOpen}
          onClose={() => setIsViewHomeworkOpen(false)}
        />
      )}
    </>
  );
};

export default LessonDetailsDialog;
