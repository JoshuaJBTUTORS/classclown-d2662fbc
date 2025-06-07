
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AvailableTutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  rating?: number;
  specialities?: string[];
}

export const useAvailableTutors = (subjectId?: string) => {
  const [tutors, setTutors] = useState<AvailableTutor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) {
      setTutors([]);
      return;
    }

    const fetchAvailableTutors = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('tutors')
          .select(`
            id,
            first_name,
            last_name,
            email,
            bio,
            rating,
            specialities,
            tutor_subjects!inner(subject_id)
          `)
          .eq('status', 'active')
          .eq('tutor_subjects.subject_id', subjectId);

        if (error) throw error;
        setTutors(data || []);
      } catch (err) {
        console.error('Error fetching available tutors:', err);
        setError('Failed to load available tutors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTutors();
  }, [subjectId]);

  return { tutors, isLoading, error };
};
