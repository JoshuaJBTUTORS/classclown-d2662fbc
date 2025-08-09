
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantUrl {
  launch_url: string;
  participant_type: 'tutor' | 'student';
  participant_name: string;
}

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

        if (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') {
          // Get tutor ID - admin/owner roles are treated as tutors for video room access
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutors')
            .select('id')
            .eq('email', user.email)
            .single();

          if (tutorError || !tutorData) {
            throw new Error('Tutor not found');
          }

          participantId = tutorData.id;
          participantType = 'tutor';
        } else {
          // Get student ID
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id')
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
          } else {
            participantId = studentData.id.toString();
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

        if (urlError || !urlData) {
          // If this is a tutor and no URL exists, generate one on demand
          if (participantType === 'tutor') {
            console.log('⚠️ No pre-generated tutor URL found, generating on demand...');
            
            const { data: generateResult, error: generateError } = await supabase.functions.invoke('lesson-space-integration', {
              body: {
                action: 'generate-tutor-url',
                lessonId,
                tutorId: participantId
              }
            });

            if (generateError) {
              console.error('Error generating tutor URL:', generateError);
              throw new Error('Failed to generate tutor URL: ' + generateError.message);
            }

            if (!generateResult?.success || !generateResult?.tutorUrl) {
              throw new Error('Failed to generate tutor URL');
            }

            // Cache and return the newly generated URL
            const cacheKey = `${lessonId}_${user.id}_${userRole}`;
            urlCacheRef.current[cacheKey] = generateResult.tutorUrl;
            setParticipantUrl(generateResult.tutorUrl);
            hasLoadedRef.current = true;
            return;
          }
          
          throw new Error('No pre-generated URL found for this participant');
        }

        // Cache the URL for future use
        const cacheKey = `${lessonId}_${user.id}_${userRole}`;
        urlCacheRef.current[cacheKey] = urlData.launch_url;
        setParticipantUrl(urlData.launch_url);
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
