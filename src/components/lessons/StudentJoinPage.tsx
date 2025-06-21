import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Clock, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import LessonConsentDialog from './LessonConsentDialog';

const StudentJoinPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  useEffect(() => {
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }

    // Only allow students and parents to access this page
    if (userRole !== 'student' && userRole !== 'parent') {
      navigate('/calendar');
      return;
    }

    fetchLessonAndCheckAccess();
  }, [user, lessonId, userRole]);

  const fetchLessonAndCheckAccess = async () => {
    try {
      console.log('Fetching lesson data for ID:', lessonId);
      
      // First, fetch lesson details without restrictive joins
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(first_name, last_name)
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        console.error('Error fetching lesson:', lessonError);
        toast.error('Lesson not found');
        navigate('/calendar');
        return;
      }

      console.log('Lesson found:', lessonData);
      console.log('Lesson Space Space ID:', lessonData.lesson_space_space_id);
      console.log('Lesson Space Room ID:', lessonData.lesson_space_room_id);
      console.log('Video Conference Link:', lessonData.video_conference_link);

      // Fetch lesson students separately
      const { data: lessonStudents, error: studentsError } = await supabase
        .from('lesson_students')
        .select(`
          student:students(id, first_name, last_name, email)
        `)
        .eq('lesson_id', lessonId);

      if (studentsError) {
        console.error('Error fetching lesson students:', studentsError);
      }

      // Add students to lesson data
      const processedLesson = {
        ...lessonData,
        lesson_students: lessonStudents || []
      };

      setLesson(processedLesson);

      if (userRole === 'student') {
        await checkStudentAccess(processedLesson);
      } else if (userRole === 'parent') {
        await checkParentAccess(processedLesson);
      }
    } catch (error) {
      console.error('Error in fetchLessonAndCheckAccess:', error);
      toast.error('Failed to load lesson details');
      navigate('/calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStudentAccess = async (lessonData: any) => {
    try {
      console.log('Checking student access for email:', user?.email);
      
      // Get student data based on email
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, first_name, last_name, email')
        .eq('email', user?.email)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student data:', studentError);
        toast.error('Error verifying student profile');
        navigate('/calendar');
        return;
      }

      if (!student) {
        console.log('No student profile found for email:', user?.email);
        toast.error('Student profile not found');
        navigate('/calendar');
        return;
      }

      console.log('Student found:', student);

      // Check if student is enrolled in this lesson
      const isEnrolled = lessonData.lesson_students?.some(
        (ls: any) => ls.student?.id === student.id
      );

      if (!isEnrolled) {
        console.log('Student not enrolled in lesson');
        toast.error('You are not enrolled in this lesson');
        navigate('/calendar');
        return;
      }

      console.log('Student access granted');
      setStudentData(student);
    } catch (error) {
      console.error('Error checking student access:', error);
      toast.error('Error verifying lesson access');
      navigate('/calendar');
    }
  };

  const checkParentAccess = async (lessonData: any) => {
    try {
      console.log('Checking parent access for email:', user?.email);
      
      // Get parent data based on email
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email')
        .eq('email', user?.email)
        .maybeSingle();

      if (parentError) {
        console.error('Error fetching parent data:', parentError);
        toast.error('Error verifying parent profile');
        navigate('/calendar');
        return;
      }

      if (!parent) {
        console.log('No parent profile found for email:', user?.email);
        toast.error('Parent profile not found');
        navigate('/calendar');
        return;
      }

      console.log('Parent found:', parent);

      // Check if any of parent's children are enrolled in this lesson
      const { data: parentStudents, error: parentStudentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, email')
        .eq('parent_id', parent.id);

      if (parentStudentsError) {
        console.error('Error fetching parent students:', parentStudentsError);
        toast.error('Error verifying parent access');
        navigate('/calendar');
        return;
      }

      if (!parentStudents || parentStudents.length === 0) {
        console.log('Parent has no students');
        toast.error('No students found for this parent account');
        navigate('/calendar');
        return;
      }

      // Check if any of the parent's students are enrolled in this lesson
      const hasEnrolledChild = lessonData.lesson_students?.some((ls: any) =>
        parentStudents.some(student => student.id === ls.student?.id)
      );

      if (!hasEnrolledChild) {
        console.log('None of parent\'s children are enrolled in this lesson');
        toast.error('None of your children are enrolled in this lesson');
        navigate('/calendar');
        return;
      }

      console.log('Parent access granted');
      // For parents, we'll use the parent's name in the consent dialog
      setStudentData({
        first_name: parent.first_name,
        last_name: parent.last_name,
        id: parent.id
      });
    } catch (error) {
      console.error('Error checking parent access:', error);
      toast.error('Error verifying lesson access');
      navigate('/calendar');
    }
  };

  const getStudentInviteUrl = () => {
    // Use the lesson_space_room_id instead of lesson_space_space_id for the correct URL
    if (!lesson?.lesson_space_room_id) {
      console.warn('No lesson_space_room_id found in lesson data');
      console.log('Available lesson space fields:', {
        space_id: lesson?.lesson_space_space_id,
        room_id: lesson?.lesson_space_room_id,
        room_url: lesson?.lesson_space_room_url
      });
      return null;
    }
    const url = `https://www.thelessonspace.com/space/${lesson.lesson_space_room_id}`;
    console.log('Generated student invite URL:', url);
    return url;
  };

  const handleStartConsentFlow = () => {
    setShowConsentDialog(true);
  };

  const handleConsentAccepted = () => {
    setShowConsentDialog(false);
    handleJoinLesson();
  };

  const handleJoinLesson = () => {
    // Handle Agora rooms - navigate to internal video room
    if (lesson?.video_conference_provider === 'agora' && lesson?.agora_channel_name) {
      navigate(`/video-room/${lessonId}`);
      return;
    }

    // Handle Lesson Space rooms
    const inviteUrl = getStudentInviteUrl();
    console.log('Attempting to join lesson with URL:', inviteUrl);
    if (inviteUrl) {
      // Open the simple lesson space invite URL
      window.open(inviteUrl, '_blank');
      toast.success('Redirecting to Lesson Space...');
    } else {
      toast.error('Lesson space not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading lesson details...</span>
        </div>
      </div>
    );
  }

  if (!lesson || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Lesson not found or access denied</p>
            <Button
              onClick={() => navigate('/calendar')}
              className="mt-4"
              variant="outline"
            >
              Go Back to Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if lesson has video conference capability (updated to include Agora)
  const hasVideoConference = lesson?.video_conference_link || 
                            lesson?.lesson_space_room_url || 
                            lesson?.lesson_space_room_id ||
                            (lesson?.agora_channel_name && lesson?.agora_token);

  // Update the main return JSX to handle Agora rooms
  if (hasVideoConference) {
    const isAgoraRoom = lesson?.video_conference_provider === 'agora' && lesson?.agora_channel_name;
    const isLessonSpaceRoom = lesson?.video_conference_provider === 'lesson_space' && getStudentInviteUrl();

    if (isAgoraRoom || isLessonSpaceRoom) {
      return (
        <>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Video className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Join Lesson</CardTitle>
                <p className="text-muted-foreground">
                  You're about to join your online lesson
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-lg">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      Teacher: {lesson.tutor?.first_name} {lesson.tutor?.last_name}
                    </span>
                  </div>

                  {lesson.is_group && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Group lesson • {lesson.lesson_students?.length || 0} students</span>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Welcome, {studentData.first_name}!</strong>
                    <br />
                    {isAgoraRoom 
                      ? 'Please review and accept the camera/microphone requirements before joining the video conference.'
                      : 'Please review and accept the camera/microphone requirements before joining.'
                    }
                  </p>
                </div>

                <Button
                  onClick={handleStartConsentFlow}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Review Requirements & Join Lesson
                </Button>

                <div className="text-center">
                  <Button
                    onClick={() => navigate('/calendar')}
                    variant="ghost"
                    size="sm"
                  >
                    Go Back to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <LessonConsentDialog
            isOpen={showConsentDialog}
            onClose={() => setShowConsentDialog(false)}
            onAccept={handleConsentAccepted}
            lesson={lesson}
            studentName={studentData?.first_name || 'Student'}
          />
        </>
      );
    }
  }

  // Fallback for lessons without video conference
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No video conference link available for this lesson</p>
          <Button
            onClick={() => navigate('/calendar')}
            className="mt-4"
            variant="outline"
          >
            Go Back to Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentJoinPage;
