
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExpectedStudent {
  id: number;
  first_name: string;
  last_name: string;
}

interface StudentContext {
  studentId: number;
  studentName: string;
  isParentJoin: boolean;
}

export const useVideoRoom = (lessonId: string) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expectedStudents, setExpectedStudents] = useState<ExpectedStudent[]>([]);
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);
  
  // Track if initial load has completed to prevent unnecessary reloads
  const hasLoadedRef = useRef(false);

  // Memoize video room role to prevent unnecessary recalculations
  const videoRoomRole = useMemo(() => 
    (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student'),
    [userRole]
  );

  const determineStudentContext = async (): Promise<StudentContext | null> => {
    try {
      if (userRole === 'parent') {
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (parentError || !parentData) {
          console.error('Error fetching parent data:', parentError);
          return null;
        }

        const { data: studentInLesson, error: studentError } = await supabase
          .from('lesson_students')
          .select(`
            student:students(
              id,
              first_name,
              last_name,
              parent_id
            )
          `)
          .eq('lesson_id', lessonId);

        if (studentError || !studentInLesson) {
          console.error('Error fetching lesson students:', studentError);
          return null;
        }

        const parentChild = studentInLesson.find(
          ls => ls.student?.parent_id === parentData.id
        );

        if (parentChild?.student) {
          const student = parentChild.student;
          return {
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`.trim(),
            isParentJoin: true
          };
        }
      } else if (userRole === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('user_id', user?.id)
          .single();

        if (studentError || !studentData) {
          console.error('Error fetching student data:', studentError);
          return null;
        }

        return {
          studentId: studentData.id,
          studentName: `${studentData.first_name} ${studentData.last_name}`.trim(),
          isParentJoin: false
        };
      }

      return null;
    } catch (error) {
      console.error('Error determining student context:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!user?.id || !lessonId) {
      navigate('/auth');
      return;
    }
    
    // Only load if we haven't loaded yet or if the user ID or lesson ID actually changed
    if (!hasLoadedRef.current) {
      loadVideoRoom();
      hasLoadedRef.current = true;
    }
  }, [user?.id, lessonId]); // Watch user.id instead of user object reference

  const loadVideoRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading lesson details for:', lessonId);

      // Fetch lesson details - simplified since we only need basic info now
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        console.error('Lesson fetch error:', lessonError);
        throw new Error('Lesson not found');
      }

      console.log('📚 Lesson data loaded:', lessonData.title);
      setLesson(lessonData);

      // Determine student context if needed
      let context = null;
      if (videoRoomRole !== 'tutor') {
        context = await determineStudentContext();
        setStudentContext(context);
        console.log('👤 Student context determined:', context);
      }

      // Fetch expected students for this lesson
      const { data: studentsData, error: studentsError } = await supabase
        .from('lesson_students')
        .select(`
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .eq('lesson_id', lessonId);

      if (studentsError) {
        console.error('Error fetching lesson students:', studentsError);
      } else {
        const students = studentsData
          ?.map(ls => ls.student)
          .filter(Boolean)
          .map(student => ({
            id: student.id,
            first_name: student.first_name || '',
            last_name: student.last_name || ''
          })) || [];
        
        console.log('👥 Expected students loaded:', students);
        setExpectedStudents(students);
      }

    } catch (error: any) {
      console.error('❌ Error loading video room:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadVideoRoom();
  };

  const handleLeaveRoom = () => {
    navigate('/calendar');
  };

  const getDisplayName = () => {
    if (studentContext) {
      return studentContext.studentName;
    }
    return `You (${videoRoomRole})`;
  };

  return {
    lesson,
    expectedStudents,
    studentContext,
    isLoading,
    error,
    videoRoomRole,
    handleRetry,
    handleLeaveRoom,
    getDisplayName
  };
};
