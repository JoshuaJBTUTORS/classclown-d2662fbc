import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantUrl {
  launch_url: string;
  participant_type: 'tutor' | 'student';
  participant_name: string;
}

const getDisplayName = (firstName?: string | null, lastName?: string | null, fallback = 'Participant') => {
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  return name || fallback;
};

const launchUrlMatchesRoom = (launchUrl: string, roomId?: string | null) => {
  if (!roomId) return true;

  try {
    const parsed = new URL(launchUrl);
    const launchRoom = parsed.searchParams.get('room');
    if (launchRoom) return launchRoom === roomId;
  } catch {
    // Some LessonSpace URLs are plain share links rather than Launch API URLs.
  }

  return launchUrl.includes(`/space/${roomId}`);
};

const ASSESSMENT_ROOM_ID = '2670b244-b11f-4be3-8336-32bb2ce558e9';
const ASSESSMENT_ROOM_URL = `https://www.thelessonspace.com/space/${ASSESSMENT_ROOM_ID}`;

export const useParticipantUrl = (lessonId: string) => {
  const [participantUrl, setParticipantUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole } = useAuth();
  
  // Cache URL to prevent unnecessary re-fetches
  const urlCacheRef = useRef<{ [key: string]: string }>({});
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const fetchParticipantUrl = async () => {
      if (!user?.id || !lessonId) return;

      // Check cache first
      const cacheKey = `${lessonId}_${user.id}_${userRole}`;
      if (urlCacheRef.current[cacheKey] && hasLoadedRef.current) {
        setParticipantUrl(urlCacheRef.current[cacheKey]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let participantId: string | null = null;
        let participantType: 'tutor' | 'student' = 'student';
        let participantName = 'Participant';

        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('lesson_space_room_id, lesson_space_space_id')
          .eq('id', lessonId)
          .single();

        if (lessonError || !lessonData) {
          throw new Error('Lesson not found');
        }

        if (lessonData.lesson_space_room_id === ASSESSMENT_ROOM_ID || lessonData.lesson_space_space_id === ASSESSMENT_ROOM_ID) {
          const cacheKey = `${lessonId}_${user.id}_${userRole}`;
          urlCacheRef.current[cacheKey] = ASSESSMENT_ROOM_URL;
          setParticipantUrl(ASSESSMENT_ROOM_URL);
          hasLoadedRef.current = true;
          return;
        }

        if (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') {
          // Get tutor ID - admin/owner roles are treated as tutors for video room access
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutors')
            .select('id, first_name, last_name')
            .ilike('email', user.email)
            .single();

          if ((tutorError || !tutorData) && userRole === 'tutor') {
            throw new Error('Tutor not found');
          }

          participantId = tutorData?.id || user.id;
          participantName = tutorData
            ? getDisplayName(tutorData.first_name, tutorData.last_name, user.email || 'Tutor')
            : user.email || 'Tutor';
          participantType = 'tutor';
        } else {
          // Get student ID
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, first_name, last_name')
            .eq('email', user.email)
            .single();

          if (studentError || !studentData) {
            // Try to get student ID through parent relationship
            const { data: parentData, error: parentError } = await supabase
              .from('parents')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (parentError || !parentData) {
              throw new Error('Student or parent not found');
            }

            // Get first student under this parent for the lesson
            const { data: studentThroughParent, error: studentParentError } = await supabase
              .from('students')
              .select(`
                id,
                first_name,
                last_name,
                lesson_students!inner(lesson_id)
              `)
              .eq('parent_id', parentData.id)
              .eq('lesson_students.lesson_id', lessonId)
              .limit(1)
              .single();

            if (studentParentError || !studentThroughParent) {
              throw new Error('Student not found for this lesson');
            }

            participantId = studentThroughParent.id.toString();
            participantName = getDisplayName(studentThroughParent.first_name, studentThroughParent.last_name, 'Student');
          } else {
            participantId = studentData.id.toString();
            participantName = getDisplayName(studentData.first_name, studentData.last_name, 'Student');
          }
        }

        if (!participantId) {
          throw new Error('Could not determine participant ID');
        }

        // Fetch pre-generated URL from database
        const { data: urlData, error: urlError } = await supabase
          .from('lesson_participant_urls')
          .select('launch_url, participant_type, participant_name')
          .eq('lesson_id', lessonId)
          .eq('participant_id', participantId)
          .eq('participant_type', participantType)
          .single();

        const hasMatchingUrl = urlData?.launch_url && launchUrlMatchesRoom(urlData.launch_url, lessonData.lesson_space_room_id);

        if (!urlError && hasMatchingUrl) {
          // Cache the URL for future use
          const cacheKey = `${lessonId}_${user.id}_${userRole}`;
          urlCacheRef.current[cacheKey] = urlData.launch_url;
          setParticipantUrl(urlData.launch_url);
          hasLoadedRef.current = true;
          return;
        }

        if (urlData?.launch_url && !hasMatchingUrl) {
          await supabase
            .from('lesson_participant_urls')
            .delete()
            .eq('lesson_id', lessonId)
            .eq('participant_id', participantId)
            .eq('participant_type', participantType);
        }

        const { data: generatedUrl, error: generateError } = await supabase.functions.invoke('lesson-space-integration', {
          body: {
            action: 'join-space',
            lessonId,
            participantId,
            participantType,
            participantName,
            studentId: participantType === 'student' ? Number(participantId) : undefined,
            studentName: participantType === 'student' ? participantName : undefined,
            forceRefresh: Boolean(urlData?.launch_url && !hasMatchingUrl),
          },
        });

        if (generateError || !generatedUrl?.success) {
          throw new Error(generatedUrl?.error || generateError?.message || 'No video room URL found for this participant');
        }

        const launchUrl = generatedUrl.launchUrl || generatedUrl.studentUrl;
        if (!launchUrl) {
          throw new Error('No video room URL returned for this participant');
        }

        const cacheKey = `${lessonId}_${user.id}_${userRole}`;
        urlCacheRef.current[cacheKey] = launchUrl;
        setParticipantUrl(launchUrl);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching participant URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch participant URL');
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasLoadedRef.current) {
      fetchParticipantUrl();
    }
  }, [lessonId, user?.id, userRole]); // Watch user.id instead of user object

  return { participantUrl, isLoading, error };
};