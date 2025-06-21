import React, { useState, useEffect } from 'react';
import { format, parseISO, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarIcon, Users, Video, CheckCircle2, Copy, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lesson } from '@/types/lesson';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

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
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen && lessonId) {
      fetchLessonDetails(lessonId);
    }
  }, [isOpen, lessonId]);

  const fetchLessonDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name, email),
          lesson_students(
            student:students(id, first_name, last_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data to match our Lesson interface with proper type casting
      const students = data.lesson_students.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name,
        email: ls.student.email
      }));

      const processedLesson: Lesson = {
        ...data,
        lesson_type: (data.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular',
        video_conference_provider: data.video_conference_provider as 'lesson_space' | 'google_meet' | 'zoom' | 'agora' | null,
        students,
        lesson_students: undefined
      };

      setLesson(processedLesson);
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const createRecurringInstance = async () => {
    if (!lesson) return;

    setIsCreatingInstance(true);
    try {
      const nextWeekDate = addWeeks(parseISO(lesson.start_time), 1);
      const endDate = addWeeks(parseISO(lesson.end_time), 1);

      const newLesson = {
        title: lesson.title,
        description: lesson.description,
        tutor_id: lesson.tutor_id,
        start_time: nextWeekDate.toISOString(),
        end_time: endDate.toISOString(),
        is_group: lesson.is_group,
        status: 'scheduled',
        subject: lesson.subject,
        is_recurring_instance: true,
        lesson_type: lesson.lesson_type || 'regular',
        video_conference_provider: lesson.video_conference_provider,
        video_conference_link: lesson.video_conference_link,
        agora_channel_name: lesson.agora_channel_name,
        agora_token: lesson.agora_token,
        agora_uid: lesson.agora_uid,
        agora_rtm_token: lesson.agora_rtm_token
      };

      const { data: createdLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert([newLesson])
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Add students to the new lesson instance
      if (lesson.students && lesson.students.length > 0) {
        const lessonStudentsData = lesson.students.map(student => ({
          lesson_id: createdLesson.id,
          student_id: student.id
        }));

        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);

        if (studentsError) throw studentsError;
      }

      // Transform the created lesson data with proper type casting
      const transformedLesson: Lesson = {
        ...createdLesson,
        lesson_type: (createdLesson.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular',
        video_conference_provider: createdLesson.video_conference_provider as 'lesson_space' | 'google_meet' | 'zoom' | 'agora' | null,
        students: lesson.students,
        lesson_students: []
      };

      setLesson(transformedLesson);
      toast.success('Next lesson instance created successfully!');
      setShowRecurringOptions(false);
    } catch (error) {
      console.error('Error creating recurring lesson instance:', error);
      toast.error('Failed to create lesson instance');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const handleCopyToClipboard = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No text to copy");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
          <DialogDescription>
            View details about this lesson.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading lesson details...
          </div>
        ) : lesson ? (
          <div className="py-4">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Tutor</div>
                    <div className="text-muted-foreground">
                      {lesson.tutor?.first_name} {lesson.tutor?.last_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Subject</div>
                    <div className="text-muted-foreground">{lesson.subject}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Date & Time</div>
                    <div className="text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-1 inline-block" />
                      {formatDateTime(lesson.start_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-muted-foreground">{lesson.status}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Lesson Type</div>
                    <div className="text-muted-foreground">{lesson.lesson_type}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Session Type</div>
                    <div className="text-muted-foreground">{lesson.is_group ? 'Group' : 'Individual'}</div>
                  </div>
                  {lesson.is_group && (
                    <div>
                      <div className="text-sm font-medium">Students</div>
                      <div className="text-muted-foreground">
                        <Users className="h-4 w-4 mr-1 inline-block" />
                        {lesson.students?.length || 0} students
                      </div>
                    </div>
                  )}
                  {lesson.description && (
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Description</div>
                      <div className="text-muted-foreground">{lesson.description}</div>
                    </div>
                  )}
                  {lesson.video_conference_provider && (
                    <div>
                      <div className="text-sm font-medium">Video Conference</div>
                      <div className="text-muted-foreground">
                        {lesson.video_conference_provider}
                      </div>
                    </div>
                  )}
                  {lesson.video_conference_link && (
                    <div>
                      <div className="text-sm font-medium">Video Conference Link</div>
                      <div className="flex items-center">
                        <Input
                          type="text"
                          readOnly
                          className="text-xs w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                          value={lesson.video_conference_link}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyToClipboard(lesson.video_conference_link)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {userRole === 'admin' && lesson.is_recurring && !lesson.is_recurring_instance && (
              <div className="mb-4">
                <Button onClick={() => setShowRecurringOptions(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Recurring Instance
                </Button>
              </div>
            )}

            {showRecurringOptions && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Create Next Instance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to create the next instance of this recurring lesson?
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowRecurringOptions(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRecurringInstance} disabled={isCreatingInstance}>
                      {isCreatingInstance ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Instance'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {userRole === 'admin' && lesson.video_conference_provider === 'agora' && lesson.agora_channel_name && (
                <Button className="ml-2" onClick={() => navigate(`/video-room/${lesson.id}`)}>
                  Join Agora Room
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            Lesson details not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
