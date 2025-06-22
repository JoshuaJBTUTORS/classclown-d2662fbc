
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
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
  const { getTokens, regenerateTokens } = useAgora();
  
  const [lesson, setLesson] = useState<any>(null);
  const [agoraCredentials, setAgoraCredentials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expectedStudents, setExpectedStudents] = useState<ExpectedStudent[]>([]);
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);

  // Map admin/owner roles to video room role
  const videoRoomRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student');

  // Generate deterministic UID based on role and context
  const generateUID = async () => {
    if (videoRoomRole === 'tutor') {
      // Get tutor ID from the lesson
      if (lesson?.tutor_id) {
        // Convert tutor UUID to a number (use hash of first 8 chars)
        const tutorHash = lesson.tutor_id.substring(0, 8);
        const tutorNumericId = parseInt(tutorHash, 16) % 100000;
        return 100000 + tutorNumericId; // Tutor range: 100000-199999
      }
      return 100001; // Fallback for tutors
    } else {
      // For students/parents, use the student ID
      if (studentContext) {
        return studentContext.studentId;
      }
      
      // If no student context yet, try to determine it
      const context = await determineStudentContext();
      return context ? context.studentId : 1; // Fallback to 1 if we can't determine
    }
  };

  const determineStudentContext = async (): Promise<StudentContext | null> => {
    try {
      if (userRole === 'parent') {
        // Parent joining - find which child is in this lesson
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (parentError || !parentData) {
          console.error('Error fetching parent data:', parentError);
          return null;
        }

        // Find the child enrolled in this lesson
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

        // Find the child that belongs to this parent
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
        // Direct student join - find the student record for this user
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
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }
    
    loadVideoRoom();
  }, [user, lessonId, retryCount]);

  const loadVideoRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading video room credentials for lesson:', lessonId);

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          agora_channel_name,
          agora_token,
          agora_uid,
          agora_rtm_token
        `)
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

      // Generate custom UID
      const customUID = await generateUID();
      console.log('🆔 Generated UID:', customUID, 'for role:', videoRoomRole);

      // Get tokens using the Agora integration with custom UID
      console.log('🔑 Fetching Agora credentials via edge function...');
      const credentials = await getTokens(lessonId, videoRoomRole, customUID);
      
      if (!credentials) {
        throw new Error('Failed to get Agora credentials from edge function');
      }

      console.log('✅ Agora credentials received:', {
        appId: credentials.appId?.substring(0, 8) + '...',
        channelName: credentials.channelName,
        uid: credentials.uid,
        hasRtcToken: !!credentials.rtcToken,
        hasNetless: !!credentials.netlessRoomUuid,
        tokenLength: credentials.rtcToken?.length
      });
      
      setAgoraCredentials(credentials);
    } catch (error: any) {
      console.error('❌ Error loading video room:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleRegenerateTokens = async () => {
    if (!lessonId) return;
    
    setIsRegenerating(true);
    try {
      console.log('🔄 Regenerating tokens via edge function...');
      const customUID = await generateUID();
      const credentials = await regenerateTokens(lessonId, videoRoomRole, customUID);
      
      if (credentials) {
        setAgoraCredentials(credentials);
        setError(null);
        toast.success('Credentials regenerated successfully');
        
        // Refresh lesson data to get updated tokens
        await loadVideoRoom();
      }
    } catch (error: any) {
      console.error('❌ Error regenerating tokens:', error);
      toast.error('Failed to regenerate credentials');
    } finally {
      setIsRegenerating(false);
    }
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
    agoraCredentials,
    expectedStudents,
    studentContext,
    isLoading,
    error,
    isRegenerating,
    videoRoomRole,
    handleRetry,
    handleRegenerateTokens,
    handleLeaveRoom,
    getDisplayName
  };
};
