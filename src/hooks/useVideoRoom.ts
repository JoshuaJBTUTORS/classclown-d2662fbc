
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

  // Map admin/owner roles to video room role
  const videoRoomRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student');

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

      // Get tokens using the proper agora-integration edge function
      console.log('🔑 Fetching Agora credentials via edge function...');
      const credentials = await getTokens(lessonId, videoRoomRole);
      
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
      const credentials = await regenerateTokens(lessonId, videoRoomRole);
      
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

  return {
    lesson,
    agoraCredentials,
    expectedStudents,
    isLoading,
    error,
    isRegenerating,
    videoRoomRole,
    handleRetry,
    handleRegenerateTokens,
    handleLeaveRoom
  };
};
