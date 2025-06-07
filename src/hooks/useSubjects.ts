
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, category, description')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        setSubjects(data || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return { subjects, isLoading, error };
};
