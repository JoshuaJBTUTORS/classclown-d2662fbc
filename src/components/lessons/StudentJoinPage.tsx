
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentJoin } from '@/hooks/useStudentJoin';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const StudentJoinPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { joinLessonSpace, isJoining } = useStudentJoin();
  const [lesson, setLesson] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }

    fetchLessonAndStudentData();
  }, [user, lessonId]);

  const fetchLessonAndStudentData = async () => {
    try {
      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(first_name, last_name),
          lesson_students!inner(
            student:students(id, first_name, last_name, email)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        toast.error('Failed to load lesson details');
        navigate('/');
        return;
      }

      setLesson(lessonData);

      if (userRole === 'student') {
        // Get student data based on email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, first_name, last_name, email')
          .eq('email', user.email)
          .single();

        if (studentError || !student) {
          console.error('Error fetching student data:', studentError);
          toast.error('Student profile not found');
          navigate('/');
          return;
        }

        // Check if student is enrolled in this lesson
        const isEnrolled = lessonData.lesson_students?.some(
          (ls: any) => ls.student.id === student.id
        );

        if (!isEnrolled) {
          toast.error('You are not enrolled in this lesson');
          navigate('/');
          return;
        }

        setStudentData(student);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load lesson details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLesson = async () => {
    if (!studentData || !lessonId) return;

    const studentUrl = await joinLessonSpace(
      lessonId,
      studentData.id,
      `${studentData.first_name} ${studentData.last_name}`
    );

    if (studentUrl) {
      // Open the lesson space in a new tab/window
      window.open(studentUrl, '_blank');
      toast.success('Joined lesson successfully!');
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
              onClick={() => navigate('/')}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
              Click the button below to join your lesson. A new tab will open with your lesson space.
            </p>
          </div>

          <Button
            onClick={handleJoinLesson}
            disabled={isJoining}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Joining Lesson...
              </>
            ) : (
              <>
                <Video className="h-5 w-5 mr-2" />
                Join Lesson Now
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
            >
              Go Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentJoinPage;
