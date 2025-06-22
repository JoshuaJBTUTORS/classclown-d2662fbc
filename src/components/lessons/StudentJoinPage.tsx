
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, parseISO, isBefore } from 'date-fns';
import { 
  Calendar,
  Clock,
  User,
  Users,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: string;
  subject?: string;
  tutor?: {
    first_name: string;
    last_name: string;
  };
  students?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  flexible_classroom_room_id?: string | null;
  flexible_classroom_session_data?: any;
}

const StudentJoinPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentContext, setStudentContext] = useState<any>(null);

  useEffect(() => {
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }
    
    fetchLessonAndCheckAccess();
  }, [user, lessonId]);

  const fetchLessonAndCheckAccess = async () => {
    try {
      setIsLoading(true);
      
      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        throw new Error('Lesson not found');
      }

      const students = lessonData.lesson_students?.map((ls: any) => ls.student) || [];
      
      const processedLesson: Lesson = {
        ...lessonData,
        students
      };

      setLesson(processedLesson);

      // Determine student context
      let context = null;
      if (userRole === 'parent') {
        // Parent joining - find which child is in this lesson
        const { data: parentData } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (parentData) {
          const parentChild = students.find(
            student => student.parent_id === parentData.id
          );

          if (parentChild) {
            context = {
              studentId: parentChild.id,
              studentName: `${parentChild.first_name} ${parentChild.last_name}`.trim(),
              isParentJoin: true
            };
          }
        }
      } else if (userRole === 'student') {
        // Direct student join
        const { data: studentData } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('user_id', user?.id)
          .single();

        if (studentData) {
          context = {
            studentId: studentData.id,
            studentName: `${studentData.first_name} ${studentData.last_name}`.trim(),
            isParentJoin: false
          };
        }
      }

      setStudentContext(context);

      if (!context) {
        throw new Error('You are not enrolled in this lesson');
      }

    } catch (error: any) {
      console.error('Error fetching lesson:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClassroom = () => {
    if (!lesson?.flexible_classroom_room_id || !lessonId) {
      toast.error('Classroom not available');
      return;
    }

    // Navigate to the embedded flexible classroom
    navigate(`/flexible-classroom/${lessonId}`);
  };

  const handleGoBack = () => {
    navigate('/calendar');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson details...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Unable to Access Lesson
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {error || 'This lesson could not be found or you do not have permission to access it.'}
              </p>
            </div>
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lessonStartTime = parseISO(lesson.start_time);
  const isLessonStarted = isBefore(lessonStartTime, new Date());
  const hasFlexibleClassroom = lesson.flexible_classroom_room_id && lesson.flexible_classroom_session_data;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {lesson.title}
              </CardTitle>
              <Badge 
                variant={lesson.status === 'completed' ? 'default' : 'outline'}
                className={lesson.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
              >
                {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {lesson.description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-600">{lesson.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(lessonStartTime, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(lessonStartTime, 'h:mm a')} - {format(parseISO(lesson.end_time), 'h:mm a')}
                </span>
              </div>
            </div>

            {lesson.tutor && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Tutor: {lesson.tutor.first_name} {lesson.tutor.last_name}
                </span>
              </div>
            )}

            {lesson.is_group && lesson.students && lesson.students.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    Group Lesson ({lesson.students.length} students)
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Students: {lesson.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
                </div>
              </div>
            )}

            {studentContext && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Joining as: <span className="font-medium">{studentContext.studentName}</span>
                  {studentContext.isParentJoin && (
                    <span className="text-xs ml-2">(Parent Access)</span>
                  )}
                </p>
              </div>
            )}

            <Separator />

            {/* Flexible Classroom Section */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Flexible Classroom
              </h3>
              
              {hasFlexibleClassroom ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">
                      ✓ Interactive classroom is ready with whiteboard and collaboration tools
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleJoinClassroom}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={!isLessonStarted && lesson.status !== 'completed'}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Join Flexible Classroom
                  </Button>
                  
                  {!isLessonStarted && (
                    <p className="text-xs text-center text-gray-500">
                      The classroom will be available when the lesson starts
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    The classroom has not been set up yet. Please contact your tutor.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentJoinPage;
